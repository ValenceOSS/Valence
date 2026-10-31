import { describe, expect, it } from 'vitest';
import { CatalogueSchema } from './CatalogueSchema';

const entry = {
  id: 'anilist',
  name: 'AniList',
  description: 'Anime tracking',
  author: 'Valence',
  version: '1.0.0',
  apiVersion: '^1.0',
  kinds: ['extension'],
  permissions: [{ kind: 'library', access: 'read' }],
  packageUrl:
    'https://github.com/ValenceOSS/valence-plugins/releases/download/anilist-v1.0.0/anilist-1.0.0.vplugin',
  sha256: 'a'.repeat(64),
  signature: 'AAAA',
  keyId: 'valence-official-2026',
  sourceUrl: 'https://github.com/ValenceOSS/valence-plugins/tree/main/plugins/anilist',
  publishedAt: '2026-09-28T12:00:00.000Z',
};

describe('CatalogueSchema', () => {
  it('reads a catalogue', () => {
    expect(
      CatalogueSchema.parse({
        format: 1,
        generatedAt: '2026-09-28T12:00:00.000Z',
        plugins: [entry],
      }).plugins,
    ).toHaveLength(1);
  });

  it('leaves out an entry with a malformed digest or an http package address', () => {
    expect(
      CatalogueSchema.parse({
        format: 1,
        generatedAt: '2026-09-28T12:00:00.000Z',
        plugins: [
          { ...entry, sha256: 'xyz' },
          { ...entry, packageUrl: 'http://example.com/a.vplugin' },
        ],
      }).plugins,
    ).toEqual([]);
  });

  it('reads the rest of the catalogue where a plugin or a version is for a newer Valence', () => {
    const newer = { kind: 'library', access: 'somethingNewer' };
    const read = CatalogueSchema.parse({
      format: 1,
      generatedAt: '2026-09-28T12:00:00.000Z',
      plugins: [
        { ...entry, id: 'newer', permissions: [newer] },
        {
          ...entry,
          earlier: [
            { ...entry, version: '0.9.0', permissions: [newer] },
            { ...entry, version: '0.8.0' },
          ],
        },
      ],
    });

    expect(read.plugins.map((plugin) => plugin.id)).toEqual(['anilist']);
    expect(read.plugins[0]?.earlier.map((version) => version.version)).toEqual(['0.8.0']);
  });

  it('keeps earlier versions of an entry, and reads a catalogue that lists none', () => {
    const earlier = { ...entry, version: '0.9.0', apiVersion: '^1.0' };
    const read = CatalogueSchema.parse({
      format: 1,
      generatedAt: '2026-09-28T12:00:00.000Z',
      plugins: [
        { ...entry, earlier: [earlier] },
        { ...entry, id: 'trakt' },
      ],
    });

    expect(read.plugins[0]?.earlier.map((each) => each.version)).toEqual(['0.9.0']);
    expect(read.plugins[1]?.earlier).toEqual([]);
  });
});
