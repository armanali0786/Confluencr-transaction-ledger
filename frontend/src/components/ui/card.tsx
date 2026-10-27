import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/** card-feature-light: white, hairline border, Level 1 lift. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-hairline bg-canvas shadow-level-1', className)}
      {...props}
    />
  );
}
