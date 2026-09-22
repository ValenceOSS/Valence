import { describe, expect, it } from 'vitest';
import { theChallengeFor } from './theChallengeFor';

describe('theChallengeFor', () => {
  it('answers the same for the same secret, so it can be checked', () => {
    expect(theChallengeFor('a secret')).toBe(theChallengeFor('a secret'));
  });

  it('answers differently for a different secret', () => {
    expect(theChallengeFor('a secret')).not.toBe(theChallengeFor('another'));
  });

  it('gives nothing of the secret away', () => {
    expect(theChallengeFor('a secret')).not.toContain('secret');
  });

  it('is what the phone works out on its own side, byte for byte', () => {
    expect(theChallengeFor('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
