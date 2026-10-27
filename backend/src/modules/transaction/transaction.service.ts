import { type Account, type Transaction, TransactionType } from '@prisma/client';

import { prisma } from '@db/prisma';
import { LEDGER_TRANSACTION_OPTIONS } from '@db/transaction-options';
import type { DbClient } from '@db/types';
import * as accountRepository from '@modules/account/account.repository';
import { getAccountById } from '@modules/account/account.service';
import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import { isPrismaError, PrismaErrorCode } from '@shared/errors/prisma-errors';
import type { Pagination } from '@shared/utils/pagination';

import type { CreateTransactionBody } from './transaction.schema';
import * as transactionRepository from './transaction.repository';

interface TransactionPage {
  transactions: Transaction[];
  totalRecords: number;
}

interface CreatedTransaction {
  transaction: Transaction;
  account: Account;
}

type LedgerEntry = transactionRepository.NewTransaction;

function buildDuplicateError(referenceId: string): AppError {
  return new AppError(
    ErrorCode.DUPLICATE_TRANSACTION,
    `A transaction with reference_id '${referenceId}' already exists for this account`,
  );
}

export async function lockExistingAccount(
  accountId: string,
  db: DbClient,
): Promise<accountRepository.LockedAccount> {
  const account = await accountRepository.lockAccountById(accountId, db);

  if (!account) {
    throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, `Account ${accountId} not found`);
  }

  return account;
}

export function assertSufficientBalance(
  balance: bigint,
  amount: bigint,
  message = 'Insufficient balance for this debit',
): void {
  if (balance < amount) {
    throw new AppError(ErrorCode.INSUFFICIENT_BALANCE, message);
  }
}

export async function assertReferenceIsUnused(
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
 * Appends one ledger row and applies it to the balance. Callers must already hold the
 * account's row lock inside the same DB transaction.
 */
export async function recordLedgerEntry(
  entry: LedgerEntry,
  db: DbClient,
): Promise<CreatedTransaction> {
  const transaction = await transactionRepository.insertTransaction(entry, db);
  const account = await accountRepository.incrementAccountBalance(
    entry.accountId,
    toBalanceDelta(entry.type, entry.amount),
    db,
  );

  return { transaction, account };
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

      return recordLedgerEntry({ accountId, type, amount, referenceId, description }, tx);
    }, LEDGER_TRANSACTION_OPTIONS);
  } catch (error) {
    // Fallback for a duplicate that slips past the pre-check (e.g. a lock-free code path).
    if (isPrismaError(error, PrismaErrorCode.UNIQUE_VIOLATION))
      throw buildDuplicateError(referenceId);
    throw error;
  }
}

export async function getTransactionById(transactionId: string): Promise<Transaction> {
  const transaction = await transactionRepository.findTransactionById(transactionId);

  if (!transaction) {
    throw new AppError(ErrorCode.TRANSACTION_NOT_FOUND, `Transaction ${transactionId} not found`);
  }

  return transaction;
}

export async function listAccountTransactions(
  accountId: string,
  { skip, limit }: Pagination,
): Promise<TransactionPage> {
  // An unknown account is a 404, not an empty history.
  await getAccountById(accountId);

  const [transactions, totalRecords] = await Promise.all([
    transactionRepository.findTransactionsByAccount({ accountId, skip, take: limit }),
    transactionRepository.countTransactionsByAccount(accountId),
  ]);

  return { transactions, totalRecords };
}
