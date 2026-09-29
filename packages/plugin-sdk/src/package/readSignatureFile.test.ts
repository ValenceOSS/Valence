import { describe, expect, it } from 'vitest';
import { readSignatureFile } from './readSignatureFile';

describe('readSignatureFile', () => {
  it('reads a signature file that names its key', () => {
    expect(readSignatureFile('{"keyId":"valence-official-2026","signature":"YWJj"}\n')).toEqual({
      keyId: 'valence-official-2026',
      signature: 'YWJj',
    });
  });

  it('reads a bare signature as naming no key', () => {
    expect(readSignatureFile('  YWJjZA==\n')).toEqual({ keyId: null, signature: 'YWJjZA==' });
  });

  it.each(['', 'not a signature!', '{"keyId":"k"}', '{"keyId":"","signature":"YWJj"}'])(
    'refuses %j',
    (text) => {
      expect(readSignatureFile(text)).toBeNull();
    },
  );
});
