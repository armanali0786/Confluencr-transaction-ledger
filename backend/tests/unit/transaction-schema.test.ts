import { createTransactionBodySchema } from '@modules/transaction/transaction.schema';

const ACCOUNT_ID = '6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a01';

function buildBody(overrides: Record<string, unknown> = {}) {
  return {
    account_id: ACCOUNT_ID,
    type: 'debit',
    amount: 30,
    reference_id: 'INV-1001',
    ...overrides,
  };
}

function issueMessages(input: unknown): string[] {
  const result = createTransactionBodySchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('createTransactionBodySchema', () => {
  it('parses a valid body and converts amount to minor units', () => {
    const result = createTransactionBodySchema.parse(
      buildBody({ amount: '30.5', reference_id: '  INV-1001 ', description: ' Office supplies ' }),
    );

    expect(result).toEqual({
      account_id: ACCOUNT_ID,
      type: 'debit',
      amount: 30_50n,
      reference_id: 'INV-1001',
      description: 'Office supplies',
    });
  });

  it.each([undefined, null, '', '   '])('normalises description %p to null', (description) => {
    expect(createTransactionBodySchema.parse(buildBody({ description })).description).toBeNull();
  });

  it.each([
    [0, 'amount must be greater than 0'],
    [-10, 'amount must be greater than 0'],
    ['0.00', 'amount must be greater than 0'],
    [10.123, 'amount must have at most 2 decimal places'],
    ['ten', 'amount must be a valid number'],
    [undefined, 'amount is required and must be a number'],
    ['1000000000.01', 'amount must not exceed 1000000000.00'],
  ])('rejects amount %p', (amount, message) => {
    expect(issueMessages(buildBody({ amount }))).toEqual([message]);
  });

  it('rejects an unsupported type', () => {
    expect(issueMessages(buildBody({ type: 'refund' }))).toEqual([
      "type must be either 'credit' or 'debit'",
    ]);
  });

  it.each([
    ['', 'reference_id must not be empty'],
    ['x'.repeat(65), 'reference_id must be at most 64 characters'],
    [undefined, 'reference_id is required and must be a string'],
  ])('rejects reference_id %p', (referenceId, message) => {
    expect(issueMessages(buildBody({ reference_id: referenceId }))).toEqual([message]);
  });

  it('rejects a description longer than 255 characters', () => {
    expect(issueMessages(buildBody({ description: 'd'.repeat(256) }))).toEqual([
      'description must be at most 255 characters',
    ]);
  });

  it('rejects an invalid account_id and unknown fields', () => {
    const result = createTransactionBodySchema.safeParse(
      buildBody({ account_id: 'abc', balance_after: 10 }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['invalid_format', 'unrecognized_keys']),
    );
  });
});
