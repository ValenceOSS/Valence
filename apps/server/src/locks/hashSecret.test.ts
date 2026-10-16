import { describe, expect, it } from 'vitest';
import { hashSecret } from './hashSecret';

describe('hashSecret', () => {
  it('never keeps the secret itself, and salts each hash differently', () => {
    const one = hashSecret('2468');
    const two = hashSecret('2468');

    expect(one).not.toContain('2468');
    expect(one).toMatch(/^scrypt\$/u);
    expect(one).not.toBe(two);
  });
});
