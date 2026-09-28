import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceLanding/testing/aCatalogueEntry';
import { readCatalogue } from './readCatalogue';

describe('readCatalogue', () => {
  it('lists the plugins by name', () => {
    const plugins = readCatalogue({
      format: 1,
      generatedAt: '2026-09-28T12:00:00.000Z',
      plugins: [
        aCatalogueEntry({ id: 'music-import', name: 'Playlist import' }),
        aCatalogueEntry(),
      ],
    });

    expect(plugins.map((plugin) => plugin.name)).toEqual([
      'AniList and MyAnimeList',
      'Playlist import',
    ]);
  });

  it('reads a catalogue that breaks its own schema as empty', () => {
    expect(
      readCatalogue({
        format: 1,
        generatedAt: '2026-09-28T12:00:00.000Z',
        plugins: [{ ...aCatalogueEntry(), sha256: 'not a digest' }],
      }),
    ).toEqual([]);
  });
});
