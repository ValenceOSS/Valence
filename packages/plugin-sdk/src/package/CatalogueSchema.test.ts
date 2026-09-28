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
  packageUrl: 'https://github.com/ValenceOSS/valence-plugins/releases/download/anilist-v1.0.0/anilist-1.0.0.vplugin',
  sha256: 'a'.repeat(64),
  signature: 'AAAA',
  keyId: 'valence-official-2026',
  sourceUrl: 'https://github.com/ValenceOSS/valence-plugins/tree/main/plugins/anilist',
  publishedAt: '2026-09-28T12:00:00.000Z',
};

describe('CatalogueSchema', () => {
  it('reads a catalogue', () => {
    expect(
      CatalogueSchema.parse({ format: 1, generatedAt: '2026-09-28T12:00:00.000Z', plugins: [entry] }).plugins,
    ).toHaveLength(1);
  });

  it('refuses an entry with a malformed digest or an http package address', () => {
    expect(
      CatalogueSchema.safeParse({ format: 1, generatedAt: '2026-09-28T12:00:00.000Z', plugins: [{ ...entry, sha256: 'xyz' }] })
        .success,
    ).toBe(false);
    expect(
      CatalogueSchema.safeParse({
        format: 1,
        generatedAt: '2026-09-28T12:00:00.000Z',
        plugins: [{ ...entry, packageUrl: 'http://example.com/a.vplugin' }],
      }).success,
    ).toBe(false);
  });
});
