import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';
import { describedBy } from '@/lib/control-styles';
import { applyServerErrors } from '@/lib/form-errors';
import { formatMoney } from '@/lib/format';
import { generateReferenceId } from '@/lib/reference-id';
import type { Account, TransactionType } from '@/types/api';

import { type TransactionFormValues, transactionFormSchema } from './transaction-form-schema';
import { useCreateTransaction } from './use-transactions';

const FORM_FIELDS = ['type', 'amount', 'reference_id', 'description'] as const;

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string; hint: string }> = [
  { value: 'credit', label: 'Credit', hint: 'Add money' },
  { value: 'debit', label: 'Debit', hint: 'Take money out' },
];

interface NewTransactionModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
}

export function NewTransactionModal({ account, isOpen, onClose }: NewTransactionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New transaction"
      description={`${account.name} · Balance ${formatMoney(account.balance)}`}
    >
      <NewTransactionForm account={account} onDone={onClose} />
    </Modal>
  );
}

function NewTransactionForm({ account, onDone }: { account: Account; onDone: () => void }) {
  const createTransaction = useCreateTransaction();
  // Generated once per form so a retried submission reuses it and cannot double-post.
  const [defaultReferenceId] = useState(() => generateReferenceId('TXN'));
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema(account.balance)),
    mode: 'onTouched',
    defaultValues: {
      type: 'credit',
      amount: '',
      reference_id: defaultReferenceId,
      description: '',
    },
  });
  const selectedType = useWatch({ control, name: 'type' });

  const onSubmit = handleSubmit(({ description, ...values }) =>
    createTransaction.mutate(
      { ...values, account_id: account.id, ...(description && { description }) },
      {
        onSuccess: onDone,
        onError: (error) => applyServerErrors(error, setError, FORM_FIELDS),
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 block text-caption text-ink-secondary">Type</legend>
        <div className="grid grid-cols-2 gap-1 rounded-full border border-hairline bg-canvas-soft p-1">
          {TYPE_OPTIONS.map(({ value, label, hint }) => (
            <label
              key={value}
              className={cn(
                'cursor-pointer rounded-full px-3 py-2 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                selectedType === value
                  ? 'bg-canvas shadow-level-1'
                  : 'text-ink-mute hover:text-ink',
              )}
            >
              <input type="radio" value={value} className="sr-only" {...register('type')} />
              <span
                className={cn(
                  'block text-button-sm',
                  selectedType === value && (value === 'credit' ? 'text-success' : 'text-ruby-ink'),
                )}
              >
                {label}
              </span>
              <span className="block text-micro">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="transaction-amount"
        label="Amount"
        error={errors.amount?.message}
        hint={
          selectedType === 'debit'
            ? `Available: ${formatMoney(account.balance)}`
            : 'Up to 2 decimal places'
        }
      >
        <Input
          id="transaction-amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          hasError={Boolean(errors.amount)}
          aria-describedby={describedBy('transaction-amount', errors.amount?.message)}
          {...register('amount')}
        />
      </Field>

      <Field
        id="transaction-reference"
        label="Reference ID"
        error={errors.reference_id?.message}
        hint="Unique per account. Prevents the same payment being recorded twice."
      >
        <Input
          id="transaction-reference"
          autoComplete="off"
          className="font-mono"
          hasError={Boolean(errors.reference_id)}
          aria-describedby={describedBy('transaction-reference', errors.reference_id?.message)}
          {...register('reference_id')}
        />
      </Field>

      <Field
        id="transaction-description"
        label="Description (optional)"
        error={errors.description?.message}
      >
        <Input
          id="transaction-description"
          autoComplete="off"
          placeholder="e.g. Office supplies"
          maxLength={255}
          hasError={Boolean(errors.description)}
          aria-describedby={describedBy('transaction-description', errors.description?.message)}
          {...register('description')}
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createTransaction.isPending}>
          Record {selectedType}
        </Button>
      </div>
    </form>
  );
}
