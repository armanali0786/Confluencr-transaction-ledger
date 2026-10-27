import { describe, expect, it } from 'vitest';

import { amountFieldSchema, fromCents, isAmountWithinBalance, toCents } from './money';

describe('toCents / fromCents', () => {
  it.each([
    ['0.01', 1n],
    ['30', 3000n],
    ['30.5', 3050n],
    ['699.51', 69951n],
  ])('converts %s ⇄ %s cents', (amount, cents) => {
    expect(toCents(amount)).toBe(cents);
  });

  it.each([
    [0n, '0.00'],
    [5n, '0.05'],
    [69951n, '699.51'],
    [-2005n, '-20.05'],
  ])('formats %s cents as %s', (cents, amount) => {
    expect(fromCents(cents)).toBe(amount);
  });

  it('is exact where floats are not', () => {
    expect(fromCents(toCents('0.1') + toCents('0.2'))).toBe('0.30');
  });
});

describe('isAmountWithinBalance', () => {
  it('allows the full balance and rejects one cent more', () => {
    expect(isAmountWithinBalance('100.00', '100.00')).toBe(true);
    expect(isAmountWithinBalance('100.01', '100.00')).toBe(false);
  });
});

describe('amountFieldSchema', () => {
  it.each(['1', '0.01', '1000000000', ' 25.5 '])('accepts %p', (value) => {
    expect(amountFieldSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['', 'Amount is required'],
    ['abc', 'Enter a positive amount with at most 2 decimal places'],
    ['-5', 'Enter a positive amount with at most 2 decimal places'],
    ['1.234', 'Enter a positive amount with at most 2 decimal places'],
    ['0.00', 'Amount must be greater than 0'],
    ['1000000000.01', 'Amount must not exceed 1,000,000,000.00'],
  ])('rejects %p', (value, message) => {
    const result = amountFieldSchema.safeParse(value);

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([message]);
  });
});
