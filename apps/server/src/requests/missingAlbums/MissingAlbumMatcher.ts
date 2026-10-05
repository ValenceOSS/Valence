import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { GroupedAlbum } from '@ValenceServer/requests/missingAlbums/GroupedAlbum';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type MatchedAlbum = GroupedAlbum & { hit: MusicCatalogueHit | null | undefined };

type MissingAlbumMatch = { isMatching: boolean; albums: MatchedAlbum[] };

type MissingAlbumMatcher = {
  match: (
    viewer: Extract<Viewer, { kind: 'account' }>,
    playlistId: string,
  ) => Promise<MissingAlbumMatch | null>;
  settle: (
    viewer: Extract<Viewer, { kind: 'account' }>,
    playlistId: string,
    withinMs: number,
  ) => Promise<MissingAlbumMatch | null>;
};

export type { MatchedAlbum, MissingAlbumMatch, MissingAlbumMatcher };
