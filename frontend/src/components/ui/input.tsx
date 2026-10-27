import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';
import { CONTROL_CLASSES, controlRingClasses } from '@/lib/control-styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(CONTROL_CLASSES, controlRingClasses(hasError), 'h-10', className)}
      {...props}
    />
  );
});
