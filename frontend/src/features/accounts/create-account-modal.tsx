import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { describedBy } from '@/lib/control-styles';
import { applyServerErrors } from '@/lib/form-errors';

import { useCreateAccount } from './use-accounts';

const ACCOUNT_NAME_MAX_LENGTH = 100;

const createAccountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Account name is required')
    .max(
      ACCOUNT_NAME_MAX_LENGTH,
      `Account name must be at most ${ACCOUNT_NAME_MAX_LENGTH} characters`,
    ),
});

type CreateAccountFormValues = z.infer<typeof createAccountFormSchema>;

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAccountModal({ isOpen, onClose }: CreateAccountModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create account"
      description="New accounts start with a balance of 0. Add funds with a credit transaction."
    >
      <CreateAccountForm onDone={onClose} />
    </Modal>
  );
}

function CreateAccountForm({ onDone }: { onDone: () => void }) {
  const createAccount = useCreateAccount();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountFormSchema),
    mode: 'onTouched',
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit((values) =>
    createAccount.mutate(values, {
      onSuccess: onDone,
      onError: (error) => applyServerErrors(error, setError, ['name']),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field id="account-name" label="Account name" error={errors.name?.message}>
        <Input
          id="account-name"
          placeholder="e.g. Operating account"
          autoComplete="off"
          maxLength={ACCOUNT_NAME_MAX_LENGTH}
          hasError={Boolean(errors.name)}
          aria-describedby={describedBy('account-name', errors.name?.message)}
          {...register('name')}
        />
      </Field>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createAccount.isPending}>
          Create account
        </Button>
      </div>
    </form>
  );
}
