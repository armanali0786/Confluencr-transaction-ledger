import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('lets a caller override a default utility of the same kind', () => {
    expect(cn('px-4 text-left text-slate-700', 'text-right text-rose-600')).toBe(
      'px-4 text-right text-rose-600',
    );
  });

  it('drops falsy values', () => {
    const isActive: boolean = false;
    expect(cn('a', isActive && 'b', undefined, 'c')).toBe('a c');
  });
});
