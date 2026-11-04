import { describe, expect, it } from 'vitest';
import { isBadHeader } from './isBadHeader';

describe('isBadHeader', () => {
  it('takes an ordinary header', () => {
    expect(isBadHeader({ name: 'Authorization', value: 'Bearer token', isSecret: true })).toBe(
      false,
    );
  });

  it('refuses a name holding a colon', () => {
    expect(isBadHeader({ name: 'X-Token:', value: 'a', isSecret: false })).toBe(true);
  });

  it('refuses a line break in either part', () => {
    expect(isBadHeader({ name: 'X-Token\r\nHost', value: 'a', isSecret: false })).toBe(true);
    expect(isBadHeader({ name: 'X-Token', value: 'a\nHost: b', isSecret: false })).toBe(true);
  });
});
