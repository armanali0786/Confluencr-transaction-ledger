import { Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountOptions } from '@/features/accounts/use-accounts';
import { TransferForm } from '@/features/transfers/transfer-form';
import type { TransferFormValues } from '@/features/transfers/transfer-form-schema';
import { TransferReceipt } from '@/features/transfers/transfer-receipt';
import { TransferReview } from '@/features/transfers/transfer-review';
import { useCreateTransfer } from '@/features/transfers/use-create-transfer';
import { generateReferenceId } from '@/lib/reference-id';
import type { CompletedTransfer } from '@/types/api';

type Step =
  | { kind: 'form'; serverError?: unknown }
  | { kind: 'review' }
  | { kind: 'done'; result: CompletedTransfer };

const MIN_ACCOUNTS_FOR_TRANSFER = 2;

function buildEmptyValues(fromAccountId: string): TransferFormValues {
  return {
    from_account_id: fromAccountId,
    to_account_id: '',
    amount: '',
    reference_id: generateReferenceId('TRF'),
    description: '',
  };
}

export function TransferPage() {
  const [searchParams] = useSearchParams();
  const { data, error, isPending, refetch } = useAccountOptions();
  const createTransfer = useCreateTransfer();
  const [values, setValues] = useState(() => buildEmptyValues(searchParams.get('from') ?? ''));
  const [step, setStep] = useState<Step>({ kind: 'form' });
  // Remounts the form for a fresh transfer so stale validation state is dropped.
  const [formKey, setFormKey] = useState(0);

  const accounts = data?.items ?? [];
  const source = accounts.find((account) => account.id === values.from_account_id);
  const destination = accounts.find((account) => account.id === values.to_account_id);

  const confirmTransfer = () => {
    const { description, ...input } = values;
    createTransfer.mutate(
      { ...input, ...(description && { description }) },
      {
        onSuccess: (result) => setStep({ kind: 'done', result }),
        onError: (serverError) => setStep({ kind: 'form', serverError }),
      },
    );
  };

  const startNewTransfer = () => {
    setValues(buildEmptyValues(values.from_account_id));
    setFormKey((key) => key + 1);
    setStep({ kind: 'form' });
  };

  const renderContent = () => {
    if (error) {
      return (
        <ErrorState error={error} title="Could not load accounts" onRetry={() => void refetch()} />
      );
    }
    if (isPending) return <TransferFormSkeleton />;
    if (accounts.length < MIN_ACCOUNTS_FOR_TRANSFER) {
      return (
        <EmptyState
          icon={Users}
          title="You need at least two accounts"
          description="Transfers move money between your own accounts."
          action={
            <Link to="/" className="text-body-md text-primary hover:text-primary-deep">
              Go to accounts
            </Link>
          }
        />
      );
    }
    if (step.kind === 'done') {
      return <TransferReceipt result={step.result} onNewTransfer={startNewTransfer} />;
    }
    if (step.kind === 'review' && source && destination) {
      return (
        <TransferReview
          values={values}
          source={source}
          destination={destination}
          isSubmitting={createTransfer.isPending}
          onBack={() => setStep({ kind: 'form' })}
          onConfirm={confirmTransfer}
        />
      );
    }
    return (
      <TransferForm
        key={formKey}
        accounts={accounts}
        defaultValues={values}
        serverError={step.kind === 'form' ? step.serverError : undefined}
        onReview={(reviewed) => {
          setValues(reviewed);
          setStep({ kind: 'review' });
        }}
      />
    );
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Transfer money"
        description="Move funds between accounts. Both sides are recorded atomically."
      />
      <Card className="p-6 sm:p-8">{renderContent()}</Card>
    </div>
  );
}

function TransferFormSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
