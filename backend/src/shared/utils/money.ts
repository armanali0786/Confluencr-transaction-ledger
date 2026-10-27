const MINOR_UNITS_PER_MAJOR = 100n;
const DECIMAL_PLACES = 2;
export const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Converts a decimal amount ("30", "30.5", "30.50") into minor units without ever
 * going through floating-point arithmetic.
 */
export function toMinorUnits(amount: string): bigint {
  if (!DECIMAL_AMOUNT_PATTERN.test(amount)) {
    throw new RangeError(`Invalid decimal amount: ${amount}`);
  }

  const [whole = '0', fraction = ''] = amount.split('.');
  return BigInt(whole) * MINOR_UNITS_PER_MAJOR + BigInt(fraction.padEnd(DECIMAL_PLACES, '0'));
}

/** Formats minor units as a fixed two-decimal string, e.g. 6995n → "69.95". */
export function formatMinorUnits(minorUnits: bigint): string {
  const sign = minorUnits < 0n ? '-' : '';
  const absolute = minorUnits < 0n ? -minorUnits : minorUnits;
  const whole = absolute / MINOR_UNITS_PER_MAJOR;
  const fraction = (absolute % MINOR_UNITS_PER_MAJOR).toString().padStart(DECIMAL_PLACES, '0');

  return `${sign}${whole}.${fraction}`;
}
