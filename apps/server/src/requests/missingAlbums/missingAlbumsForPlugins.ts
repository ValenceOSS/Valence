import { titleOfMusicHit } from '@ValenceServer/requests/catalogue/titleOfMusicHit';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type { MissingAlbumMatcher } from '@ValenceServer/requests/missingAlbums/MissingAlbumMatcher';

const WAITS_FOR_ALBUMS_MS = 15_000;

/**
 * The albums of a playlist's missing songs, for a plugin to ask for on somebody's behalf: the same
 * search the playlist's own button runs, waited on for a while since a plugin has nobody watching
 * it, and each album found said as a hit with where it stands.
 *
 * @param options - Whose account a profile is, the search, and how to stand titles against the
 *   library and the requests.
 * @returns What the plugin host answers with.
 */
const missingAlbumsForPlugins =
  ({
    accountOf,
    matcher,
    stand,
    waitsMs = WAITS_FOR_ALBUMS_MS,
  }: {
    accountOf: (profileId: string) => Promise<string | null>;
    matcher: MissingAlbumMatcher | null;
    stand: (titles: UnstoodTitle[]) => Promise<CatalogueTitle[]>;
    waitsMs?: number;
  }): PluginHost['requests']['missingAlbums'] =>
  async (profileId, playlistId) => {
    const accountId = await accountOf(profileId);

    if (matcher === null || accountId === null) {
      return null;
    }

    const match = await matcher.settle(
      { kind: 'account', accountId, profileId, isAdministrator: false },
      playlistId,
      waitsMs,
    );

    if (match === null) {
      return null;
    }

    const hits = new Map(
      match.albums.flatMap((album) =>
        album.hit === undefined || album.hit === null
          ? []
          : [[album.hit.musicBrainzId, album.hit] as const],
      ),
    );
    const stood = hits.size === 0 ? [] : await stand([...hits.values()].map(titleOfMusicHit));

    return {
      isMatching: match.isMatching,
      albums: stood.map((title) => ({
        catalogueId: title.id,
        kind: 'album' as const,
        title: title.title,
        year: title.year,
        artist: title.subtitle,
        isInLibrary: title.standing.status === 'library',
        isRequested: title.standing.status === 'requested',
      })),
    };
  };

export { missingAlbumsForPlugins };
