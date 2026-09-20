import { describe, expect, it, vi } from 'vitest';
import { describeCatalogueTitle } from './describeCatalogueTitle';
import type { DescriptionSources } from './describeCatalogueTitle';

const PINK_FLOYD = '83d91898-7763-47d7-b03b-b92132375c47';

const ALBUM = {
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  title: 'The Wall',
  type: 'album' as const,
  firstReleased: '1979-11-30',
};

/**
 * Sources that know Severance and Pink Floyd, and find Deezer's 2 as Pink Floyd.
 */
const sources = () => {
  const given = {
    describeTitle: vi.fn<DescriptionSources['describeTitle']>(() =>
      Promise.resolve({
        title: 'Severance',
        year: 2022,
        overview: null,
        posterUrl: null,
        backdropUrl: 'https://b.jpg',
        genres: ['Drama'],
        runtimeMinutes: 55,
        cast: [{ name: 'Adam Scott', role: 'Mark S.', photoUrl: null }],
      }),
    ),
    describeMusic: vi.fn<DescriptionSources['describeMusic']>(() =>
      Promise.resolve({
        title: 'Pink Floyd',
        year: null,
        aliases: [],
        overview: 'UK rock band',
        posterUrl: null,
        runtimeMinutes: null,
        releaseDates: { theatrical: null, digital: null, physical: null },
        episodes: [],
        isEnded: true,
        artist: 'Pink Floyd',
        albums: [ALBUM],
      }),
    ),
    findOnMusicBrainz: vi.fn<DescriptionSources['findOnMusicBrainz']>((_kind, deezerId) =>
      Promise.resolve(deezerId === 2 ? PINK_FLOYD : null),
    ),
  };

  return given satisfies DescriptionSources;
};

describe('describeCatalogueTitle', () => {
  it('describes a series with its backdrop, genres and cast', async () => {
    const asked = sources();

    expect(await describeCatalogueTitle(asked, 'series', '95396')).toMatchObject({
      kind: 'series',
      id: '95396',
      musicBrainzId: null,
      backdropUrl: 'https://b.jpg',
      cast: [{ name: 'Adam Scott' }],
    });
    expect(asked.describeTitle).toHaveBeenCalledWith('95396', 'tv');
  });

  it('describes an artist from the charts by the MusicBrainz id they turn out to have', async () => {
    const asked = sources();

    expect(await describeCatalogueTitle(asked, 'artist', 'deezer-2')).toMatchObject({
      kind: 'artist',
      id: PINK_FLOYD,
      musicBrainzId: PINK_FLOYD,
      overview: 'UK rock band',
      albums: [ALBUM],
    });
    expect(asked.describeMusic).toHaveBeenCalledWith(PINK_FLOYD, 'artist');
  });

  it('knows nothing of music MusicBrainz cannot find', async () => {
    const asked = sources();

    expect(await describeCatalogueTitle(asked, 'album', 'deezer-9')).toBeNull();
    expect(await describeCatalogueTitle(asked, 'album', 'deezer-nonsense')).toBeNull();
    expect(asked.describeMusic).not.toHaveBeenCalled();
  });
});
