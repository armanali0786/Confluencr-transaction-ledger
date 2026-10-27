import { Plus, Wallet } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';
import { AccountCard, AccountCardSkeleton } from '@/features/accounts/account-card';
import { CreateAccountModal } from '@/features/accounts/create-account-modal';
import { ACCOUNTS_PAGE_SIZE, useAccounts } from '@/features/accounts/use-accounts';
import { usePageParam } from '@/hooks/use-page-param';

export function AccountsPage() {
  const [page, setPage] = usePageParam();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, error, isPending, isFetching, refetch } = useAccounts(page);
  const openCreate = () => setIsCreateOpen(true);

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Balances update the moment a transaction or transfer is recorded."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Create account
          </Button>
        }
      />

      {error ? (
        <Card>
          <ErrorState
            error={error}
            title="Could not load accounts"
            onRetry={() => void refetch()}
          />
        </Card>
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {Array.from({ length: 3 }, (_, index) => (
            <AccountCardSkeleton key={index} />
          ))}
        </div>
      ) : data.meta.total_records === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="No accounts yet"
            description="Create your first account, then add funds with a credit transaction."
            action={<Button onClick={openCreate}>Create account</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
          {data.meta.total_records > ACCOUNTS_PAGE_SIZE && (
            <Card className="mt-6 overflow-hidden">
              <Pagination meta={data.meta} onPageChange={setPage} isFetching={isFetching} />
            </Card>
          )}
        </>
      )}

      <CreateAccountModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
