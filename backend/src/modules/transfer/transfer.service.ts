import { type Account, type Transaction, type Transfer, TransactionType } from '@prisma/client';

import { prisma } from '@db/prisma';
import { LEDGER_TRANSACTION_OPTIONS } from '@db/transaction-options';
import type { DbClient } from '@db/types';
import type { LockedAccount } from '@modules/account/account.repository';
import {
  assertReferenceIsUnused,
  assertSufficientBalance,
  lockExistingAccount,
  recordLedgerEntry,
} from '@modules/transaction/transaction.service';
import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import { isPrismaError, PrismaErrorCode } from '@shared/errors/prisma-errors';

import type { CreateTransferBody } from './transfer.schema';
import * as transferRepository from './transfer.repository';

export interface CompletedTransfer {
  transfer: Transfer;
  debit: Transaction;
  credit: Transaction;
  fromAccount: Account;
  toAccount: Account;
}

function buildDuplicateTransferError(referenceId: string): AppError {
  return new AppError(
    ErrorCode.DUPLICATE_TRANSACTION,
    `A transfer or transaction with reference_id '${referenceId}' already exists`,
  );
}

function assertDifferentAccounts(fromAccountId: string, toAccountId: string): void {
  if (fromAccountId === toAccountId) {
    throw new AppError(
      ErrorCode.SAME_ACCOUNT_TRANSFER,
      'from_account_id and to_account_id must be different accounts',
    );
  }
}

/**
 * Locks both accounts in ascending id order. Every transfer acquires locks in the same
 * global order, so A→B and B→A running concurrently can never wait on each other.
 */
async function lockAccountsInOrder(
  fromAccountId: string,
  toAccountId: string,
  db: DbClient,
): Promise<{ from: LockedAccount; to: LockedAccount }> {
  const fromLocksFirst = fromAccountId < toAccountId;
  const [firstId, secondId] = fromLocksFirst
    ? [fromAccountId, toAccountId]
    : [toAccountId, fromAccountId];

  const first = await lockExistingAccount(firstId, db);
  const second = await lockExistingAccount(secondId, db);

  return fromLocksFirst ? { from: first, to: second } : { from: second, to: first };
}

async function assertTransferReferenceIsUnused(
  { fromAccountId, toAccountId, referenceId }: transferRepository.NewTransfer,
  db: DbClient,
): Promise<void> {
  if (await transferRepository.findTransferByReference(referenceId, db)) {
    throw buildDuplicateTransferError(referenceId);
  }
  // Both ledger rows reuse the transfer reference, so it must be free on each account too.
  await assertReferenceIsUnused(fromAccountId, referenceId, db);
  await assertReferenceIsUnused(toAccountId, referenceId, db);
}

async function executeTransfer(
  transferData: transferRepository.NewTransfer,
  db: DbClient,
): Promise<CompletedTransfer> {
  const { fromAccountId, toAccountId, amount, referenceId, description } = transferData;
  const { from } = await lockAccountsInOrder(fromAccountId, toAccountId, db);
  await assertTransferReferenceIsUnused(transferData, db);
  assertSufficientBalance(from.balance, amount, 'Insufficient balance for this transfer');

  const transfer = await transferRepository.insertTransfer(transferData, db);
  const ledgerEntry = { amount, referenceId, description, transferId: transfer.id };
  const debit = await recordLedgerEntry(
    { ...ledgerEntry, accountId: fromAccountId, type: TransactionType.debit },
    db,
  );
  const credit = await recordLedgerEntry(
    { ...ledgerEntry, accountId: toAccountId, type: TransactionType.credit },
    db,
  );

  return {
    transfer,
    debit: debit.transaction,
    credit: credit.transaction,
    fromAccount: debit.account,
    toAccount: credit.account,
  };
}

/**
 * Moves money between two accounts in a single DB transaction: the transfer row, the
 * debit, the credit and both balance updates commit together or not at all.
 */
export async function createTransfer(input: CreateTransferBody): Promise<CompletedTransfer> {
  const transferData: transferRepository.NewTransfer = {
    fromAccountId: input.from_account_id,
    toAccountId: input.to_account_id,
    amount: input.amount,
    referenceId: input.reference_id,
    description: input.description,
  };
  assertDifferentAccounts(transferData.fromAccountId, transferData.toAccountId);

  try {
    return await prisma.$transaction(
      (tx) => executeTransfer(transferData, tx),
      LEDGER_TRANSACTION_OPTIONS,
    );
  } catch (error) {
    // Fallback for a concurrent request that claimed the same reference first.
    if (isPrismaError(error, PrismaErrorCode.UNIQUE_VIOLATION)) {
      throw buildDuplicateTransferError(transferData.referenceId);
    }
    throw error;
  }
}
