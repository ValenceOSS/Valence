import { describe, expect, it } from 'vitest';
import { NamesSchema } from './NamesSchema';

describe('NamesSchema', () => {
  it('reads a list of names, and anything else as none', () => {
    expect(NamesSchema.parse(['Rock', 'Pop'])).toEqual(['Rock', 'Pop']);
    expect(NamesSchema.parse(null)).toEqual([]);
    expect(NamesSchema.parse('Rock')).toEqual([]);
  });
});
