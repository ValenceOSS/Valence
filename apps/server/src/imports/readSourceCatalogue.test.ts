import { describe, expect, it, vi } from 'vitest';
import { aSourceToImport } from './aSourceToImport';
import { readSourceCatalogue } from './readSourceCatalogue';
import type { ValenceIndex } from './readValenceIndex';

const INDEX: ValenceIndex = {
  filmsByTmdb: new Map([['949', ['valence-heat']]]),
  filmsByImdb: new Map(),
  filmsByTitle: new Map(),
  byPath: new Map([['/media/tv/The Wire/Season 01/S01E02.mkv', 'valence-102']]),
  episodesByTmdb: new Map([['1438|1|1', 'valence-101']]),
  episodesByTitle: new Map(),
  seriesByTmdb: new Map([['1438', 'valence-wire']]),
  seriesByTitle: new Map(),
  tracksByAlbumId: new Map([['2c0a3d1e-aaaa-4bbb-8ccc-000000000001|1|3', 'valence-track']]),
  tracksByAlbumTitle: new Map(),
  artistsByMusicBrainz: new Map(),
  artistsByName: new Map(),
  durations: new Map(),
  kinds: new Map(),
};

describe('readSourceCatalogue', () => {
  it('reads every library, looks up programmes known only by TVDB, and matches everything', async () => {
    const onLibrary = vi.fn();
    const tmdbOfTvdb = vi.fn((tvdb: number) => Promise.resolve(tvdb === 79126 ? 1438 : null));
    const catalogue = await readSourceCatalogue({
      reader: aSourceToImport(),
      index: INDEX,
      mappings: [{ from: '/data/tv', to: '/media/tv' }],
      tmdbOfTvdb,
      onLibrary,
    });

    expect(catalogue.libraries).toHaveLength(4);
    expect(onLibrary).toHaveBeenCalledWith(0, 4, 'Films');
    expect(tmdbOfTvdb).toHaveBeenCalledWith(79126);
    expect(
      Object.fromEntries(
        [...catalogue.matches].map(([id, match]) => [
          id,
          match.kind === 'item'
            ? match.mediaItemId
            : match.kind === 'series'
              ? match.seriesId
              : 'unmatched',
        ]),
      ),
    ).toEqual({
      heat: 'valence-heat',
      home: 'unmatched',
      wire: 'valence-wire',
      'wire-101': 'valence-101',
      'wire-102': 'valence-102',
      track: 'valence-track',
    });
    expect(catalogue.unmatched.map(({ item }) => item.id)).toEqual(['home']);
    expect(catalogue.byId.get('album')?.title).toBe('Blue Lines');
  });

  it('carries on where a TVDB id cannot be looked up', async () => {
    const catalogue = await readSourceCatalogue({
      reader: aSourceToImport(),
      index: INDEX,
      mappings: [],
      tmdbOfTvdb: () => Promise.reject(new Error('no catalogue')),
      onLibrary: () => undefined,
    });

    expect(catalogue.matches.get('wire')?.kind).toBe('unmatched');
  });
});
