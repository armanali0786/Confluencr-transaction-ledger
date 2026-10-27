import { describe, expect, it } from 'vitest';

import { generateReferenceId } from './reference-id';

describe('generateReferenceId', () => {
  it('creates prefixed, API-compatible references', () => {
    const reference = generateReferenceId('TRF');

    expect(reference).toMatch(/^TRF-[0-9A-F]{10}$/);
    expect(reference.length).toBeLessThanOrEqual(64);
  });

  it('creates a different reference each time', () => {
    expect(generateReferenceId('TXN')).not.toBe(generateReferenceId('TXN'));
  });
});
