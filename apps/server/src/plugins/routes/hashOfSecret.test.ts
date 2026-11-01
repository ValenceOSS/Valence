import { describe, expect, it } from 'vitest';
import { hashOfSecret } from './hashOfSecret';

describe('hashOfSecret', () => {
  it('hashes a secret the same way every time, and two secrets differently', () => {
    expect(hashOfSecret('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(hashOfSecret('abd')).not.toBe(hashOfSecret('abc'));
  });
});
