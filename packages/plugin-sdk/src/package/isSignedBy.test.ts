import { describe, expect, it } from 'vitest';
import { aKeyPair } from '@ValenceSDK/testing/aKeyPair';
import { isSignedBy } from './isSignedBy';
import { signBytes } from './signBytes';

const bytes = new TextEncoder().encode('a catalogue');

describe('isSignedBy', () => {
  it('names the key that signed, where the signature names it', () => {
    const one = aKeyPair();
    const other = aKeyPair();
    const keys = { one: one.publicKey, other: other.publicKey };

    expect(
      isSignedBy(bytes, { keyId: 'other', signature: signBytes(bytes, other.privateKey) }, keys),
    ).toBe('other');
  });

  it('tries every key where the signature names none', () => {
    const one = aKeyPair();

    expect(
      isSignedBy(
        bytes,
        { keyId: null, signature: signBytes(bytes, one.privateKey) },
        { one: one.publicKey },
      ),
    ).toBe('one');
  });

  it('refuses a signature that names a key other than the one that signed', () => {
    const one = aKeyPair();
    const other = aKeyPair();
    const keys = { one: one.publicKey, other: other.publicKey };

    expect(
      isSignedBy(bytes, { keyId: 'one', signature: signBytes(bytes, other.privateKey) }, keys),
    ).toBeNull();
  });

  it('refuses a key it does not know', () => {
    expect(
      isSignedBy(
        bytes,
        { keyId: null, signature: signBytes(bytes, aKeyPair().privateKey) },
        { one: aKeyPair().publicKey },
      ),
    ).toBeNull();
  });
});
