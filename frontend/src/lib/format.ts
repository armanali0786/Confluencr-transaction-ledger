const CURRENCY = import.meta.env.VITE_CURRENCY ?? 'INR';
const LOCALE = 'en-IN';

const moneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });

/**
 * Formats an API money string ("1234.50") for display. API amounts are capped well
 * below Number.MAX_SAFE_INTEGER / 100, so converting for display loses no precision.
 */
export function formatMoney(amount: string | number): string {
  return moneyFormatter.format(Number(amount));
}

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
