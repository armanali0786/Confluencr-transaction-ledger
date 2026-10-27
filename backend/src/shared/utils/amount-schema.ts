import { z } from 'zod';

import { DECIMAL_AMOUNT_PATTERN, formatMinorUnits, toMinorUnits } from './money';

/** Upper bound per operation; keeps balances far below the BIGINT ceiling. */
export const MAX_AMOUNT_MINOR_UNITS = 1_000_000_000_00n;

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;
const NON_ZERO_DIGIT = /[1-9]/;

/**
 * Accepts a JSON number (30, 30.5) or numeric string ("30.50") and outputs minor units
 * as a bigint. Numbers are converted via their string form, so no float arithmetic is
 * ever applied to the value.
 */
export const amountSchema = z
  .union([z.number(), z.string().trim()], { error: 'amount is required and must be a number' })
  .transform(String)
  .pipe(
    z
      .string()
      .regex(NUMERIC_PATTERN, { error: 'amount must be a valid number', abort: true })
      .refine((value) => !value.startsWith('-') && NON_ZERO_DIGIT.test(value), {
        error: 'amount must be greater than 0',
        abort: true,
      })
      .refine((value) => DECIMAL_AMOUNT_PATTERN.test(value), {
        error: 'amount must have at most 2 decimal places',
        abort: true,
      })
      .transform(toMinorUnits)
      .refine((minorUnits) => minorUnits <= MAX_AMOUNT_MINOR_UNITS, {
        error: `amount must not exceed ${formatMinorUnits(MAX_AMOUNT_MINOR_UNITS)}`,
      }),
  );
