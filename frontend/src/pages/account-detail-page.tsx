import { ArrowLeft, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { toApiError } from '@/api/errors';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { AccountSummary, AccountSummarySkeleton } from '@/features/accounts/account-summary';
import { useAccount } from '@/features/accounts/use-accounts';
import { NewTransactionModal } from '@/features/transactions/new-transaction-modal';
import { TransactionTable } from '@/features/transactions/transaction-table';
import { usePageParam } from '@/hooks/use-page-param';

const NOT_FOUND_CODES = new Set(['ACCOUNT_NOT_FOUND', 'VALIDATION_ERROR']);

export function AccountDetailPage() {
  const { accountId = '' } = useParams<{ accountId: string }>();
  const [page, setPage] = usePageParam();
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const { data: account, error, isPending, refetch } = useAccount(accountId);

  return (
    <>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All accounts
      </Link>

      {error ? (
        <Card>
          {NOT_FOUND_CODES.has(toApiError(error).code) ? (
            <EmptyState
              icon={SearchX}
              title="Account not found"
              description="This account does not exist. Check the link or pick an account from the list."
            />
          ) : (
            <ErrorState
              error={error}
              title="Could not load account"
              onRetry={() => void refetch()}
            />
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {isPending ? (
            <AccountSummarySkeleton />
          ) : (
            <AccountSummary account={account} onNewTransaction={() => setIsTransactionOpen(true)} />
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="font-semibold text-slate-900">Transactions</h2>
              <p className="text-sm text-slate-500">Latest first. Ledger entries are permanent.</p>
            </div>
            <TransactionTable accountId={accountId} page={page} onPageChange={setPage} />
          </Card>
        </div>
      )}

      {account && (
        <NewTransactionModal
          account={account}
          isOpen={isTransactionOpen}
          onClose={() => setIsTransactionOpen(false)}
        />
      )}
    </>
  );
}
