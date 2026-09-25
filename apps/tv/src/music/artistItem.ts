import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import type { MusicArtist } from '@ValenceContracts/schemas/Music';
import type { MusicItem } from '@ValenceTv/music/MusicItem';
import { say } from '@ValenceI18n/say';

/**
 * An artist as a tile: their picture, or the cover of one of their albums where there is none.
 *
 * @param artist - The artist.
 * @returns The tile's item.
 */
const artistItem = (artist: MusicArtist): MusicItem => ({
  kind: 'artist',
  id: artist.id,
  title: artist.name,
  detail: say('tv.artistItem.detail'),
  art: artist.hasImage
    ? artistImageUrl(artist.id)
    : artist.imageAlbumId === null
      ? null
      : albumArtworkUrl(artist.imageAlbumId),
  view: { kind: 'artist', id: artist.id },
});

export { artistItem };
