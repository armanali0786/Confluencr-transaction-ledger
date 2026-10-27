import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline-on-dark';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-level-1 hover:bg-primary-deep active:bg-primary-press',
  secondary: 'border border-primary bg-canvas text-primary hover:bg-primary/5 active:bg-primary/10',
  'outline-on-dark':
    'border border-on-primary/40 text-on-primary hover:bg-on-primary/10 active:bg-on-primary/15',
};

// Pill geometry never drops below 8px 16px padding; heights keep touch targets ≥ 36–40px.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-4 py-2 text-button-sm',
  md: 'min-h-10 px-4 py-2 text-button-md',
};

/** Pill button styling, shared by <Button> and links that look like buttons. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}
