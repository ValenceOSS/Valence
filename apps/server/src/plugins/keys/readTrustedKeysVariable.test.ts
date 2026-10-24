import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { readTrustedKeysVariable } from './readTrustedKeysVariable';

const aKey = () =>
  generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' }).toString();

describe('readTrustedKeysVariable', () => {
  it('reads id=key pairs split by commas or new lines, keeping the padding in a key', () => {
    const first = aKey();
    const second = aKey();
    const line = (pem: string) => pem.split('\n')[1] ?? '';

    expect(line(first).endsWith('=')).toBe(true);
    expect(
      readTrustedKeysVariable(`home-lab=${line(first)},\n friends = ${line(second)}\n`),
    ).toEqual({ keys: { 'home-lab': first, friends: second }, unreadable: [] });
  });

  it('names what it could not read, and reads nothing from an empty variable', () => {
    expect(readTrustedKeysVariable('')).toEqual({ keys: {}, unreadable: [] });
    expect(readTrustedKeysVariable('broken=AAAA,Bad Id=AAAA,lonely')).toEqual({
      keys: {},
      unreadable: ['broken', 'Bad Id', 'lonely'],
    });
  });
});
