import { AlertTriangle } from 'lucide-react';

import { describeApiError, toApiError } from '@/api/errors';

import { Button } from './button';

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <div className="rounded-full bg-rose-50 p-3">
        <AlertTriangle className="size-6 text-rose-600" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{describeApiError(toApiError(error))}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
