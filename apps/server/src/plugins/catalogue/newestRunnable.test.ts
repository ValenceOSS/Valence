import { describe, expect, it } from 'vitest';
import { newestRunnable } from './newestRunnable';
import type { CatalogueEntry, CatalogueVersion } from '@ValenceSDK/package/CatalogueSchema';

const aVersion = (version: string, apiVersion: string): CatalogueVersion => ({
  version,
  apiVersion,
  permissions: [],
  packageUrl: `https://example.com/anime-tracker-${version}.vplugin`,
  sha256: 'a'.repeat(64),
  signature: 'AAAA',
  keyId: 'valence-official-2026',
  publishedAt: '2026-10-01T00:00:00.000Z',
});

const anEntry = (newest: CatalogueVersion, earlier: CatalogueVersion[]): CatalogueEntry => ({
  ...newest,
  id: 'anime-tracker',
  name: 'Anime Tracker',
  description: 'Tracks anime.',
  author: 'Valence',
  kinds: ['extension'],
  sourceUrl: 'https://example.com/source',
  earlier,
});

describe('newestRunnable', () => {
  it('takes the newest version where this server runs it', () => {
    const entry = anEntry(aVersion('2.0.0', '^1.3'), [aVersion('1.4.0', '^1.2')]);

    expect(newestRunnable(entry, '1.3.0')?.version).toBe('2.0.0');
  });

  it('falls back to the newest earlier version an older server runs, with its own package', () => {
    const entry = anEntry(aVersion('2.0.0', '^1.3'), [
      aVersion('1.2.0', '^1.0'),
      aVersion('1.10.0', '^1.2'),
    ]);
    const chosen = newestRunnable(entry, '1.2.0');

    expect(chosen?.version).toBe('1.10.0');
    expect(chosen?.packageUrl).toBe('https://example.com/anime-tracker-1.10.0.vplugin');
    expect(chosen?.name).toBe('Anime Tracker');
  });

  it('finds nothing where no version runs here', () => {
    expect(newestRunnable(anEntry(aVersion('2.0.0', '^2.0'), []), '1.3.0')).toBeNull();
  });
});
