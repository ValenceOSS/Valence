import { describe, expect, it } from 'vitest';
import { fingerprintOfText } from './fingerprintOfText';

describe('fingerprintOfText', () => {
  it('gives the same sixteen digits for the same text, and different ones for different text', () => {
    expect(fingerprintOfText('a')).toMatch(/^[0-9a-f]{16}$/);
    expect(fingerprintOfText('a')).toBe(fingerprintOfText('a'));
    expect(fingerprintOfText('a')).not.toBe(fingerprintOfText('b'));
  });
});
