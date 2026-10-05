import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';

/**
 * An artist or album MusicBrainz found, in the one shape every catalogue's titles are shown in: an
 * album under its artist, an artist under what tells them apart from others of the name.
 *
 * @param hit - What MusicBrainz found.
 * @returns It as a title, not yet stood against the library or the requests.
 */
const titleOfMusicHit = (hit: MusicCatalogueHit): UnstoodTitle => ({
  kind: hit.kind,
  id: hit.musicBrainzId,
  title: hit.title,
  subtitle: hit.artist ?? hit.disambiguation,
  year: hit.year,
  overview: null,
  posterUrl: hit.coverUrl,
});

export { titleOfMusicHit };
