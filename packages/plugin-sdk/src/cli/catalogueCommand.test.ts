import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CatalogueSchema } from '@ValenceSDK/package/CatalogueSchema';
import { sha256Of } from '@ValenceSDK/package/sha256Of';
import { verifySignature } from '@ValenceSDK/package/verifySignature';
import { aPluginFolder } from '@ValenceSDK/testing/aPluginFolder';
import { aTheme } from '@ValenceSDK/testing/aTheme';
import { catalogueCommand } from './catalogueCommand';
import { packCommand } from './packCommand';

const keys = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');

  return {
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  };
};

const options = (packagesDirectory: string, outDirectory: string, privateKeyPem: string) => ({
  packagesDirectory,
  outDirectory,
  keyId: 'test-key',
  privateKeyPem,
  packageUrl: 'https://example.com/releases/{id}-v{version}/{file}',
  sourceUrl: 'https://example.com/tree/main/plugins/{id}',
  iconUrl: 'https://example.com/icons/{file}',
  now: new Date('2026-09-28T12:00:00.000Z'),
});

describe('catalogueCommand', () => {
  it('lists every package, signs each one and the list, and writes their icons', () => {
    const pair = keys();
    const packages = mkdtempSync(join(tmpdir(), 'valence-packages-'));
    const site = join(mkdtempSync(join(tmpdir(), 'valence-site-')), 'site');

    packCommand(aPluginFolder(), packages);
    packCommand(
      aPluginFolder({
        id: 'midnight',
        entry: undefined,
        permissions: [],
        contributes: { themes: [{ id: 'midnight', name: 'Midnight', dark: aTheme() }] },
        icon: undefined,
      }),
      packages,
    );
    writeFileSync(join(packages, 'notes.txt'), 'ignored');

    const catalogue = catalogueCommand(options(packages, site, pair.privateKey));
    const text = readFileSync(join(site, 'catalogue.json'), 'utf8');
    const [anime, midnight] = catalogue.plugins;

    expect(CatalogueSchema.parse(JSON.parse(text))).toEqual(catalogue);
    expect(
      verifySignature(
        Buffer.from(text),
        readFileSync(join(site, 'catalogue.json.sig'), 'utf8').trim(),
        pair.publicKey,
      ),
    ).toBe(true);
    expect(anime?.kinds).toEqual(['extension']);
    expect(anime?.packageUrl).toBe(
      'https://example.com/releases/anime-tracker-v1.2.0/anime-tracker-1.2.0.vplugin',
    );
    expect(anime?.iconUrl).toBe('https://example.com/icons/anime-tracker-icon.png');
    expect(anime?.sha256).toBe(
      sha256Of(readFileSync(join(packages, 'anime-tracker-1.2.0.vplugin'))),
    );
    expect(
      verifySignature(
        readFileSync(join(packages, 'anime-tracker-1.2.0.vplugin')),
        anime?.signature ?? '',
        pair.publicKey,
      ),
    ).toBe(true);
    expect(existsSync(join(site, 'icons', 'anime-tracker-icon.png'))).toBe(true);
    expect(midnight?.kinds).toEqual(['theme']);
    expect(midnight?.iconUrl).toBeUndefined();
  });

  it('refuses a folder holding a broken package, naming it', () => {
    const packages = mkdtempSync(join(tmpdir(), 'valence-packages-'));

    writeFileSync(join(packages, 'broken-1.0.0.vplugin'), 'not gzip');

    expect(() =>
      catalogueCommand(
        options(packages, mkdtempSync(join(tmpdir(), 'valence-site-')), keys().privateKey),
      ),
    ).toThrow('broken-1.0.0.vplugin: The package is not a gzipped Valence plugin.');
  });
});
