import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { describedBy } from '@/lib/control-styles';
import { applyServerErrors } from '@/lib/form-errors';
import { formatMoney } from '@/lib/format';
import type { Account } from '@/types/api';

import { type TransferFormValues, transferFormSchema } from './transfer-form-schema';

const FORM_FIELDS = [
  'from_account_id',
  'to_account_id',
  'amount',
  'reference_id',
  'description',
] as const;

interface TransferFormProps {
  accounts: Account[];
  defaultValues: TransferFormValues;
  /** Error from a rejected confirmation, shown next to the field it concerns. */
  serverError?: unknown;
  onReview: (values: TransferFormValues) => void;
}

export function TransferForm({
  accounts,
  defaultValues,
  serverError,
  onReview,
}: TransferFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema(accounts)),
    mode: 'onTouched',
    defaultValues,
  });
  const [fromAccountId, toAccountId] = useWatch({
    control,
    name: ['from_account_id', 'to_account_id'],
  });
  useEffect(() => {
    if (serverError) applyServerErrors(serverError, setError, FORM_FIELDS);
  }, [serverError, setError]);

  const source = accounts.find((account) => account.id === fromAccountId);
  const destination = accounts.find((account) => account.id === toAccountId);

  return (
    <form onSubmit={handleSubmit(onReview)} noValidate className="space-y-5">
      <Field
        id="transfer-from"
        label="From"
        error={errors.from_account_id?.message}
        hint={source && `Available: ${formatMoney(source.balance)}`}
      >
        <Select
          id="transfer-from"
          hasError={Boolean(errors.from_account_id)}
          aria-describedby={describedBy('transfer-from', errors.from_account_id?.message)}
          {...register('from_account_id', { deps: ['to_account_id', 'amount'] })}
        >
          <option value="">Select source account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {formatMoney(account.balance)}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex justify-center" aria-hidden>
        <div className="rounded-full bg-slate-100 p-1.5">
          <ArrowDown className="size-4 text-slate-500" />
        </div>
      </div>

      <Field
        id="transfer-to"
        label="To"
        error={errors.to_account_id?.message}
        hint={destination && `Current balance: ${formatMoney(destination.balance)}`}
      >
        <Select
          id="transfer-to"
          hasError={Boolean(errors.to_account_id)}
          aria-describedby={describedBy('transfer-to', errors.to_account_id?.message)}
          {...register('to_account_id')}
        >
          <option value="">Select destination account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id} disabled={account.id === fromAccountId}>
              {account.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="transfer-amount"
        label="Amount"
        error={errors.amount?.message}
        hint="Up to 2 decimal places"
      >
        <Input
          id="transfer-amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          hasError={Boolean(errors.amount)}
          aria-describedby={describedBy('transfer-amount', errors.amount?.message)}
          {...register('amount')}
        />
      </Field>

      <Field
        id="transfer-reference"
        label="Reference ID"
        error={errors.reference_id?.message}
        hint="Unique per transfer. Prevents the same transfer being made twice."
      >
        <Input
          id="transfer-reference"
          autoComplete="off"
          className="font-mono"
          hasError={Boolean(errors.reference_id)}
          aria-describedby={describedBy('transfer-reference', errors.reference_id?.message)}
          {...register('reference_id')}
        />
      </Field>

      <Field
        id="transfer-description"
        label="Description (optional)"
        error={errors.description?.message}
      >
        <Input
          id="transfer-description"
          autoComplete="off"
          placeholder="e.g. Monthly rent share"
          maxLength={255}
          hasError={Boolean(errors.description)}
          aria-describedby={describedBy('transfer-description', errors.description?.message)}
          {...register('description')}
        />
      </Field>

      <Button type="submit" className="w-full">
        Review transfer
      </Button>
    </form>
  );
}
