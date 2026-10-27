import { formatMinorUnits, toMinorUnits } from '@shared/utils/money';

describe('toMinorUnits', () => {
  it.each([
    ['100', 100_00n],
    ['30.5', 30_50n],
    ['30.05', 30_05n],
    ['0.01', 1n],
    ['0.10', 10n],
    ['1000000.99', 1_000_000_99n],
  ])('converts %s to %s minor units', (amount, expected) => {
    expect(toMinorUnits(amount)).toBe(expected);
  });

  it('avoids floating-point drift', () => {
    // 0.1 + 0.2 !== 0.3 in floats; string-based conversion must stay exact.
    expect(toMinorUnits('0.1') + toMinorUnits('0.2')).toBe(toMinorUnits('0.3'));
  });

  it.each(['', '-1', '1.234', 'abc', '1e3', '.5', '1.'])('rejects %p', (amount) => {
    expect(() => toMinorUnits(amount)).toThrow(RangeError);
  });
});

describe('formatMinorUnits', () => {
  it.each([
    [0n, '0.00'],
    [1n, '0.01'],
    [10n, '0.10'],
    [100_00n, '100.00'],
    [699_51n, '699.51'],
    [-20_05n, '-20.05'],
  ])('formats %s as %s', (minorUnits, expected) => {
    expect(formatMinorUnits(minorUnits)).toBe(expected);
  });
});
