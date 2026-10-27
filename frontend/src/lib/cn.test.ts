import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('lets a caller override a default utility of the same kind', () => {
    expect(cn('px-4 text-left text-ink', 'text-right text-ruby-ink')).toBe(
      'px-4 text-right text-ruby-ink',
    );
  });

  it('keeps a custom type token alongside a colour', () => {
    expect(cn('text-body-md text-ink')).toBe('text-body-md text-ink');
  });

  it('resolves conflicts between custom type and shadow tokens', () => {
    expect(cn('text-caption shadow-level-1', 'text-heading-lg shadow-level-2')).toBe(
      'text-heading-lg shadow-level-2',
    );
  });

  it('drops falsy values', () => {
    const isActive: boolean = false;
    expect(cn('a', isActive && 'b', undefined, 'c')).toBe('a c');
  });
});
