import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type BadgeTone = 'success' | 'danger' | 'brand';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-success/10 text-success',
  danger: 'bg-ruby/10 text-ruby-ink',
  brand: 'bg-primary-subdued/45 text-primary-deep',
};

/** pill-tag-soft: all-caps micro label on a tinted pill. */
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-micro-cap uppercase',
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}
