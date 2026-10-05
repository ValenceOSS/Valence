import { describe, expect, it, vi } from 'vitest';
import { missingAlbumsForPlugins } from './missingAlbumsForPlugins';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type { MissingAlbumMatcher } from '@ValenceServer/requests/missingAlbums/MissingAlbumMatcher';

const hitFor = (id: string, title: string): MusicCatalogueHit => ({
  kind: 'album',
  musicBrainzId: id,
  title,
  artist: 'Bicep',
  disambiguation: null,
  type: 'album',
  year: 2021,
  coverUrl: null,
});

const song = {
  title: 'Apricots',
  artist: 'Bicep',
  album: 'Isles',
  releaseId: null,
  coverUrl: null,
};

const ISLES = hitFor('00000000-0000-4000-8000-0000000000a1', 'Isles');
const KEPT = hitFor('00000000-0000-4000-8000-0000000000a2', 'Kept');

/**
 * A matcher that is still looking for one album and has found two others, one of them twice.
 */
const aMatcher = (): MissingAlbumMatcher => {
  const settled: MissingAlbumMatcher['settle'] = vi.fn((_viewer, playlistId: string) =>
    Promise.resolve(
      playlistId === 'pl1'
        ? {
            isMatching: true,
            albums: [
              { key: 'a', song, songCount: 1, hit: ISLES },
              { key: 'b', song, songCount: 1, hit: ISLES },
              { key: 'c', song, songCount: 1, hit: KEPT },
              { key: 'd', song, songCount: 1, hit: null },
              { key: 'e', song, songCount: 1, hit: undefined },
            ],
          }
        : null,
    ),
  );

  return { match: (viewer, playlistId) => settled(viewer, playlistId, 0), settle: settled };
};

const stand = (titles: UnstoodTitle[]): Promise<CatalogueTitle[]> =>
  Promise.resolve(
    titles.map((title) => ({
      ...title,
      standing: {
        status: title.title === 'Kept' ? ('library' as const) : ('askable' as const),
        mediaId: null,
        requestId: null,
        requestState: null,
      },
    })),
  );

describe('missingAlbumsForPlugins', () => {
  it('waits on the search as the person, and gives each album found once, with where it stands', async () => {
    const matcher = aMatcher();
    const find = missingAlbumsForPlugins({
      accountOf: (profileId) => Promise.resolve(profileId === 'p1' ? 'a1' : null),
      matcher,
      stand,
      waitsMs: 10,
    });

    expect(await find('p1', 'pl1')).toEqual({
      isMatching: true,
      albums: [
        {
          catalogueId: ISLES.musicBrainzId,
          kind: 'album',
          title: 'Isles',
          year: 2021,
          artist: 'Bicep',
          isInLibrary: false,
          isRequested: false,
        },
        expect.objectContaining({ title: 'Kept', isInLibrary: true }),
      ],
    });
    expect(matcher.settle).toHaveBeenCalledWith(
      { kind: 'account', accountId: 'a1', profileId: 'p1', isAdministrator: false },
      'pl1',
      10,
    );
  });

  it('finds nothing for nobody, a playlist that cannot be read, or a server that cannot search', async () => {
    const accountOf = () => Promise.resolve('a1');

    expect(
      await missingAlbumsForPlugins({
        accountOf: () => Promise.resolve(null),
        matcher: aMatcher(),
        stand,
      })('p1', 'pl1'),
    ).toBeNull();
    expect(
      await missingAlbumsForPlugins({ accountOf, matcher: aMatcher(), stand })('p1', 'gone'),
    ).toBeNull();
    expect(
      await missingAlbumsForPlugins({ accountOf, matcher: null, stand })('p1', 'pl1'),
    ).toBeNull();
  });
});
