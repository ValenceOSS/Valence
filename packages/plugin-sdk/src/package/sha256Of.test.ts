import { describe, expect, it } from 'vitest';
import { sha256Of } from './sha256Of';

describe('sha256Of', () => {
  it('writes the digest as lower-case hex', () => {
    expect(sha256Of(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
