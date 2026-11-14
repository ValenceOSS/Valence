import { describe, expect, it } from 'vitest';
import { LONGEST_IDENTIFIER } from '@ValenceServer/auth/LONGEST_IDENTIFIER';

describe('LONGEST_IDENTIFIER', () => {
  it('is the longest an email address may be', () => {
    expect(LONGEST_IDENTIFIER).toBe(254);
  });
});
