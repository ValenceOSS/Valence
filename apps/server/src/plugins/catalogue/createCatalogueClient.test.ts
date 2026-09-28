import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { sha256Of } from '@ValenceSDK/package/sha256Of';
import { signBytes } from '@ValenceSDK/package/signBytes';
import { createCatalogueClient } from './createCatalogueClient';
import { readSignatureFile } from './readSignatureFile';

const pair = () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');

  return {
    publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
};

const TRUSTED = pair();

const STRANGER = pair();

const PACKAGE = new TextEncoder().encode('pretend package bytes');

const entry = (signedWith = TRUSTED.privatePem, bytes = PACKAGE) => ({
  id: 'anime-tracking',
  name: 'Anime tracking',
  description: 'Keeps AniList up to date.',
  author: 'Valence',
  version: '1.0.0',
  apiVersion: '^1.0',
  kinds: ['extension' as const],
  permissions: [],
  packageUrl: 'https://github.com/ValenceOSS/valence-plugins/releases/download/a/anime.vplugin',
  sha256: sha256Of(bytes),
  signature: signBytes(bytes, signedWith),
  keyId: 'valence-official-2026',
  sourceUrl: 'https://github.com/ValenceOSS/valence-plugins',
  publishedAt: '2026-09-28T00:00:00.000Z',
});

const catalogueBytes = (entries = [entry()]) =>
  new TextEncoder().encode(
    JSON.stringify({ format: 1, generatedAt: '2026-09-28T00:00:00.000Z', plugins: entries }),
  );

const URL_OF = 'https://valenceoss.github.io/valence-plugins/catalogue.json';

const build = (files: Record<string, Uint8Array | null>, now = () => 0) => {
  const download = vi.fn((url: string) => Promise.resolve(files[url] ?? null));

  return {
    download,
    client: createCatalogueClient({
      url: URL_OF,
      download,
      keys: { 'valence-official-2026': TRUSTED.publicPem },
      now,
    }),
  };
};

const signed = (bytes: Uint8Array, key = TRUSTED.privatePem, asJson = false) =>
  new TextEncoder().encode(
    asJson
      ? JSON.stringify({ keyId: 'valence-official-2026', signature: signBytes(bytes, key) })
      : signBytes(bytes, key),
  );

describe('the official plugin catalogue', () => {
  it('reads a signed catalogue, and keeps it for a while', async () => {
    const bytes = catalogueBytes();
    let clock = 0;
    const { client, download } = build(
      { [URL_OF]: bytes, [`${URL_OF}.sig`]: signed(bytes) },
      () => clock,
    );

    const first = await client.read();

    expect(first.problem).toBeNull();
    expect(first.catalogue?.plugins[0]?.id).toBe('anime-tracking');

    await client.read();
    expect(download).toHaveBeenCalledTimes(2);

    clock = 11 * 60 * 1000;
    await client.read();
    expect(download).toHaveBeenCalledTimes(4);
  });

  it('reads a signature written as JSON naming its key', async () => {
    const bytes = catalogueBytes();
    const { client } = build({
      [URL_OF]: bytes,
      [`${URL_OF}.sig`]: signed(bytes, TRUSTED.privatePem, true),
    });

    expect((await client.read()).problem).toBeNull();
  });

  it('refuses a catalogue signed by anybody else, or not at all', async () => {
    const bytes = catalogueBytes();

    expect(
      (
        await build({
          [URL_OF]: bytes,
          [`${URL_OF}.sig`]: signed(bytes, STRANGER.privatePem),
        }).client.read()
      ).problem,
    ).toBe('The plugin catalogue is not signed by the Valence project.');
    expect(
      (
        await build({
          [URL_OF]: bytes,
          [`${URL_OF}.sig`]: new TextEncoder().encode('!!'),
        }).client.read()
      ).problem,
    ).toBe('The plugin catalogue is not signed by the Valence project.');
    expect((await build({ [URL_OF]: bytes }).client.read()).problem).toBe(
      'The plugin catalogue could not be reached.',
    );
  });

  it('refuses a signed catalogue that does not read', async () => {
    const junk = new TextEncoder().encode('{"format":2}');
    const notJson = new TextEncoder().encode('not json');

    expect(
      (await build({ [URL_OF]: junk, [`${URL_OF}.sig`]: signed(junk) }).client.read()).problem,
    ).toBe('The plugin catalogue could not be read.');
    expect(
      (await build({ [URL_OF]: notJson, [`${URL_OF}.sig`]: signed(notJson) }).client.read())
        .problem,
    ).toBe('The plugin catalogue could not be read.');
  });

  it('fetches a package only when it hashes and is signed as the catalogue says', async () => {
    const good = entry();
    const { client } = build({ [good.packageUrl]: PACKAGE });

    expect(await client.fetchPackage(good)).toEqual({ bytes: PACKAGE });
    expect(await client.fetchPackage({ ...good, sha256: 'b'.repeat(64) })).toEqual({
      problem: 'Anime tracking is not the package the catalogue describes.',
    });
    expect(await client.fetchPackage(entry(STRANGER.privatePem))).toEqual({
      problem: 'Anime tracking is not signed by the key the catalogue names.',
    });
    expect(await client.fetchPackage({ ...good, keyId: 'someone-else' })).toEqual({
      problem: 'Anime tracking is not signed by the key the catalogue names.',
    });
    expect(await build({}).client.fetchPackage(good)).toEqual({
      problem: 'Anime tracking could not be downloaded.',
    });
  });
});

describe('reading a signature file', () => {
  it('reads both forms, and nothing else', () => {
    expect(readSignatureFile(' abc= \n')).toEqual({ keyId: null, signature: 'abc=' });
    expect(readSignatureFile('{"keyId":"k","signature":"abc="}')).toEqual({
      keyId: 'k',
      signature: 'abc=',
    });
    expect(readSignatureFile('{"keyId":"k"}')).toBeNull();
    expect(readSignatureFile('not base64!')).toBeNull();
  });
});
