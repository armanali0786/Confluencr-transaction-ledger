import { type Account, type Transaction, TransactionType } from '@prisma/client';

import { prisma } from '@db/prisma';
import type { DbClient } from '@db/types';
import * as accountRepository from '@modules/account/account.repository';
import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import { isPrismaError, PrismaErrorCode } from '@shared/errors/prisma-errors';

import type { CreateTransactionBody } from './transaction.schema';
import * as transactionRepository from './transaction.repository';

// Writers queue on the account row lock, so allow time to wait for it under contention.
const TRANSACTION_OPTIONS = { maxWait: 5_000, timeout: 10_000 };

export interface CreatedTransaction {
  transaction: Transaction;
  account: Account;
}

function buildDuplicateError(referenceId: string): AppError {
  return new AppError(
    ErrorCode.DUPLICATE_TRANSACTION,
    `A transaction with reference_id '${referenceId}' already exists for this account`,
  );
}

async function lockExistingAccount(
  accountId: string,
  db: DbClient,
): Promise<accountRepository.LockedAccount> {
  const account = await accountRepository.lockAccountById(accountId, db);

  if (!account) {
    throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, `Account ${accountId} not found`);
  }

  return account;
}

export function assertSufficientBalance(balance: bigint, amount: bigint): void {
  if (balance < amount) {
    throw new AppError(ErrorCode.INSUFFICIENT_BALANCE, 'Insufficient balance for this debit');
  }
}

async function assertReferenceIsUnused(
  accountId: string,
  referenceId: string,
  db: DbClient,
): Promise<void> {
  const existing = await transactionRepository.findTransactionByReference(
    accountId,
    referenceId,
    db,
  );

  if (existing) throw buildDuplicateError(referenceId);
}

function toBalanceDelta(type: TransactionType, amount: bigint): bigint {
  return type === TransactionType.credit ? amount : -amount;
}

/**
 * Records a credit or debit and updates the balance in one DB transaction. The account
 * row is locked first, so every check below sees a balance no one else can change.
 */
export async function createTransaction(input: CreateTransactionBody): Promise<CreatedTransaction> {
  const { account_id: accountId, type, amount, reference_id: referenceId, description } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      const account = await lockExistingAccount(accountId, tx);
      await assertReferenceIsUnused(accountId, referenceId, tx);
      if (type === TransactionType.debit) assertSufficientBalance(account.balance, amount);

      const transaction = await transactionRepository.insertTransaction(
        { accountId, type, amount, referenceId, description },
        tx,
      );
      const updatedAccount = await accountRepository.incrementAccountBalance(
        accountId,
        toBalanceDelta(type, amount),
        tx,
      );

      return { transaction, account: updatedAccount };
    }, TRANSACTION_OPTIONS);
  } catch (error) {
    // Fallback for a duplicate that slips past the pre-check (e.g. a lock-free code path).
    if (isPrismaError(error, PrismaErrorCode.UNIQUE_VIOLATION))
      throw buildDuplicateError(referenceId);
    throw error;
  }
}
