import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { cn } from '@/lib/cn';
import { dismissToast, getToasts, subscribeToToasts } from '@/lib/toast-store';

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToToasts, getToasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {toasts.map(({ id, variant, title, description }) => {
        const Icon = variant === 'success' ? CheckCircle2 : XCircle;
        return (
          <div
            key={id}
            role={variant === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-hairline bg-canvas p-4 shadow-level-2"
          >
            <Icon
              aria-hidden
              className={cn(
                'mt-0.5 size-5 shrink-0',
                variant === 'success' ? 'text-success' : 'text-ruby',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-body-md text-ink">{title}</p>
              {description && description !== title && (
                <p className="mt-0.5 text-caption text-ink-mute">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(id)}
              className="rounded-full p-0.5 text-ink-mute hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
