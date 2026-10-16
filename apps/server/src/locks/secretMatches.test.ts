import { describe, expect, it } from 'vitest';
import { hashSecret } from './hashSecret';
import { secretMatches } from './secretMatches';

describe('secretMatches', () => {
  it('knows the secret a hash was made from, and no other', () => {
    const kept = hashSecret('2468');

    expect(secretMatches('2468', kept)).toBe(true);
    expect(secretMatches('2469', kept)).toBe(false);
  });

  it('refuses a hash it cannot read', () => {
    expect(secretMatches('2468', 'plain')).toBe(false);
  });
});
