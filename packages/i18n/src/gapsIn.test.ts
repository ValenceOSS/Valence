import { describe, expect, it } from 'vitest';
import { gapsIn } from './gapsIn';

describe('gapsIn', () => {
  it('names each gap once, in the order they first appear', () => {
    expect(gapsIn('{name} added {count} to {name}’s list')).toEqual(['name', 'count']);
  });

  it('finds nothing in words with no gaps', () => {
    expect(gapsIn('Nothing to fill')).toEqual([]);
  });
});
