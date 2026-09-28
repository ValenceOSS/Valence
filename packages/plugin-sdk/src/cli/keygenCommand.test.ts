import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { signBytes } from '@ValenceSDK/package/signBytes';
import { verifySignature } from '@ValenceSDK/package/verifySignature';
import { keygenCommand } from './keygenCommand';

describe('keygenCommand', () => {
  it('writes a matching pair, with the private key readable by its owner alone', () => {
    const paths = keygenCommand(join(mkdtempSync(join(tmpdir(), 'valence-keys-')), 'keys'), 'test-key');
    const bytes = new TextEncoder().encode('x');

    expect(statSync(paths.privateKey).mode & 0o777).toBe(0o600);
    expect(
      verifySignature(bytes, signBytes(bytes, readFileSync(paths.privateKey, 'utf8')), readFileSync(paths.publicKey, 'utf8')),
    ).toBe(true);
  });
});
