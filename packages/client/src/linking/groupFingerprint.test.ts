import { describe, expect, it } from 'vitest';
import { groupFingerprint } from './groupFingerprint';

describe('groupFingerprint', () => {
  it('writes a fingerprint in groups of four', () => {
    expect(groupFingerprint('0123456789abcdef01')).toBe('0123 4567 89ab cdef 01');
    expect(groupFingerprint('')).toBe('');
  });
});
