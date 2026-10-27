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
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <div className="rounded-full bg-ruby/10 p-3">
        <AlertTriangle className="size-6 text-ruby-ink" aria-hidden />
      </div>
      <h3 className="mt-4 text-heading-sm text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-body-md text-ink-mute">
        {describeApiError(toApiError(error))}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
