export const CONTROL_CLASSES =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';

export function controlRingClasses(hasError: boolean): string {
  return hasError ? 'ring-rose-400 focus:ring-rose-500' : 'ring-slate-300 focus:ring-brand-600';
}

/** Matches the ids rendered by <Field /> so controls can point aria-describedby at them. */
export function describedBy(id: string, error?: string): string {
  return error ? `${id}-error` : `${id}-hint`;
}
