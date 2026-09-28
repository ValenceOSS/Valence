import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifySignature } from '@ValenceSDK/package/verifySignature';
import { signCommand } from './signCommand';

describe('signCommand', () => {
  it('writes a signature beside the file that verifies against it', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const path = join(mkdtempSync(join(tmpdir(), 'valence-sign-')), 'a.vplugin');

    writeFileSync(path, 'bytes');

    const signaturePath = signCommand(path, privateKey.export({ type: 'pkcs8', format: 'pem' }).toString());

    expect(signaturePath).toBe(`${path}.sig`);
    expect(
      verifySignature(
        readFileSync(path),
        readFileSync(signaturePath, 'utf8').trim(),
        publicKey.export({ type: 'spki', format: 'pem' }).toString(),
      ),
    ).toBe(true);
  });
});
