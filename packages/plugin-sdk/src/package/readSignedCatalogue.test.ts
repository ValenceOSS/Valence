import { describe, expect, it } from 'vitest';
import { aKeyPair } from '@ValenceSDK/testing/aKeyPair';
import { readSignedCatalogue } from './readSignedCatalogue';
import { signBytes } from './signBytes';

const TRUSTED = aKeyPair();

const KEYS = { 'valence-official-2026': TRUSTED.publicKey };

const EMPTY = new TextEncoder().encode(
  JSON.stringify({ format: 1, generatedAt: '2026-09-29T00:00:00.000Z', plugins: [] }),
);

/**
 * A signature file for some bytes, signed by a given key and naming the official key.
 *
 * @param bytes - What was signed.
 * @param privateKey - The key that signed it.
 * @returns The signature file's text.
 */
const signed = (bytes: Uint8Array, privateKey: string): string =>
  JSON.stringify({ keyId: 'valence-official-2026', signature: signBytes(bytes, privateKey) });

describe('readSignedCatalogue', () => {
  it('reads a catalogue signed by a trusted key', () => {
    expect(readSignedCatalogue(EMPTY, signed(EMPTY, TRUSTED.privateKey), KEYS)).toEqual({
      catalogue: { format: 1, generatedAt: '2026-09-29T00:00:00.000Z', plugins: [] },
    });
  });

  it('reads nothing signed by anybody else, or not signed at all', () => {
    expect(readSignedCatalogue(EMPTY, signed(EMPTY, aKeyPair().privateKey), KEYS)).toEqual({
      problem: 'unsigned',
    });
    expect(readSignedCatalogue(EMPTY, '', KEYS)).toEqual({ problem: 'unsigned' });
  });

  it('reads nothing changed after it was signed', () => {
    const changed = new TextEncoder().encode(
      JSON.stringify({ format: 1, generatedAt: '2026-09-30T00:00:00.000Z', plugins: [] }),
    );

    expect(readSignedCatalogue(changed, signed(EMPTY, TRUSTED.privateKey), KEYS)).toEqual({
      problem: 'unsigned',
    });
  });

  it('says a signed catalogue it cannot read is unreadable', () => {
    const odd = new TextEncoder().encode('{"format":2}');

    expect(readSignedCatalogue(odd, signed(odd, TRUSTED.privateKey), KEYS)).toEqual({
      problem: 'unreadable',
    });
  });
});
