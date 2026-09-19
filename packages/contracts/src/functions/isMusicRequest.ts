import type { MediaRequestKind, MusicRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether a kind of request is for music, which is found by its MusicBrainz id rather than its
 * TMDB one, fetched from the indexers' music, and filed into a music library.
 *
 * @param kind - The kind.
 * @returns Whether it is an artist or an album.
 */
const isMusicRequest = (kind: MediaRequestKind): kind is MusicRequestKind =>
  kind === 'artist' || kind === 'album';

export { isMusicRequest };
