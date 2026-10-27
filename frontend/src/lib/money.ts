import { z } from 'zod';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const NON_ZERO_DIGIT = /[1-9]/;
const MAX_AMOUNT_CENTS = 1_000_000_000_00n;

/** Converts a validated decimal string to integer minor units, avoiding float maths. */
export function toCents(amount: string): bigint {
  const [whole = '0', fraction = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

/** Inverse of toCents: 6995n → "69.95". */
export function fromCents(cents: bigint): string {
  const sign = cents < 0n ? '-' : '';
  const absolute = cents < 0n ? -cents : cents;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`;
}

export function isAmountWithinBalance(amount: string, balance: string): boolean {
  return AMOUNT_PATTERN.test(amount) && toCents(amount) <= toCents(balance);
}

/** Mirrors the API's amount rules so most mistakes are caught before a request is sent. */
export const amountFieldSchema = z
  .string()
  .trim()
  .min(1, { message: 'Amount is required', abort: true })
  .refine((value) => AMOUNT_PATTERN.test(value), {
    message: 'Enter a positive amount with at most 2 decimal places',
    abort: true,
  })
  .refine((value) => NON_ZERO_DIGIT.test(value), {
    message: 'Amount must be greater than 0',
    abort: true,
  })
  .refine((value) => toCents(value) <= MAX_AMOUNT_CENTS, {
    message: 'Amount must not exceed 1,000,000,000.00',
  });
