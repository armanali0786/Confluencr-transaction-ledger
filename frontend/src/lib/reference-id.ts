/**
 * Generates a client-side reference. It is created once per form, so retrying the same
 * submission re-sends the same reference and the API rejects it as a duplicate instead
 * of moving money twice.
 */
export function generateReferenceId(prefix: 'TXN' | 'TRF'): string {
  const random = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  return `${prefix}-${random}`;
}
