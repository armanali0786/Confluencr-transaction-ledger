export const CONTROL_CLASSES =
  'block min-h-10 w-full rounded-sm border bg-canvas px-3 py-2 text-body-md text-ink transition-colors placeholder:text-ink-mute/70 focus:ring-3 focus:outline-none disabled:bg-canvas-soft disabled:text-ink-mute';

/** text-input: hairline-input border at rest, primary border on focus; ruby when invalid. */
export function controlRingClasses(hasError: boolean): string {
  return hasError
    ? 'border-ruby focus:border-ruby focus:ring-ruby/15'
    : 'border-hairline-input focus:border-primary focus:ring-primary/15';
}

/** Matches the ids rendered by <Field /> so controls can point aria-describedby at them. */
export function describedBy(id: string, error?: string): string {
  return error ? `${id}-error` : `${id}-hint`;
}
