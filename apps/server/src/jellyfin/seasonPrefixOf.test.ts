import { describe, expect, it } from 'vitest';
import { seasonPrefixOf } from './seasonPrefixOf';

describe('seasonPrefixOf', () => {
  it('is twenty-eight digits, the same for the same programme', () => {
    expect(seasonPrefixOf('a:x')).toMatch(/^[0-9a-f]{28}$/u);
    expect(seasonPrefixOf('a:x')).toBe(seasonPrefixOf('a:x'));
    expect(seasonPrefixOf('a:x')).not.toBe(seasonPrefixOf('a:y'));
  });
});
