import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';
import { CONTROL_CLASSES, controlRingClasses } from '@/lib/control-styles';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError = false, className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(CONTROL_CLASSES, controlRingClasses(hasError), 'pr-8', className)}
      {...props}
    >
      {children}
    </select>
  );
});
