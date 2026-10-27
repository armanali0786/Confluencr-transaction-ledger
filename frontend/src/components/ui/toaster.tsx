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
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-200"
          >
            <Icon
              aria-hidden
              className={cn(
                'mt-0.5 size-5 shrink-0',
                variant === 'success' ? 'text-emerald-500' : 'text-rose-500',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{title}</p>
              {description && description !== title && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(id)}
              className="rounded-md p-0.5 text-slate-400 hover:text-slate-600"
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
