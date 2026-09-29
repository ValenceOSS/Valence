import { describe, expect, it } from 'vitest';
import { aKeyPair } from '@ValenceSDK/testing/aKeyPair';
import { catalogueSignedBy } from './catalogueSignedBy';
import { signBytes } from './signBytes';

const TRUSTED = aKeyPair();

const bytes = new TextEncoder().encode('{"format":1}');

describe('catalogueSignedBy', () => {
  it('names the trusted key that signed the catalogue', () => {
    const file = JSON.stringify({
      keyId: 'official',
      signature: signBytes(bytes, TRUSTED.privateKey),
    });

    expect(catalogueSignedBy(bytes, file, { official: TRUSTED.publicKey })).toBe('official');
  });

  it('names nobody for a signature file it cannot read, or a key it does not trust', () => {
    const stranger = JSON.stringify({
      keyId: 'official',
      signature: signBytes(bytes, aKeyPair().privateKey),
    });

    expect(catalogueSignedBy(bytes, 'nonsense!', { official: TRUSTED.publicKey })).toBeNull();
    expect(catalogueSignedBy(bytes, stranger, { official: TRUSTED.publicKey })).toBeNull();
  });
});
