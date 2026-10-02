import { describe, expect, it } from 'vitest';
import { hashSetupToken } from './hashSetupToken';

describe('hashSetupToken', () => {
  it('keeps a SHA-256 of the token rather than the token', () => {
    expect(hashSetupToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
