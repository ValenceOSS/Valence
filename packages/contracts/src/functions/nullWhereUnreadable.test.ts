import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { nullWhereUnreadable } from '@ValenceContracts/functions/nullWhereUnreadable';

describe('nullWhereUnreadable', () => {
  const kind = nullWhereUnreadable(z.enum(['browser', 'tv']));

  it('reads a value it understands', () => {
    expect(kind.parse('tv')).toBe('tv');
  });

  it('reads a value it does not understand as nothing, rather than failing', () => {
    expect(kind.parse('fridge')).toBeNull();
    expect(kind.parse(null)).toBeNull();
  });
});
