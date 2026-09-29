import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { CarRow } from '@ValenceMobile/carPlay/NativeCarPlay.types';

/**
 * An album as a row in the car, played from the start when chosen.
 *
 * @param album - The album.
 * @returns The row.
 */
const rowForAnAlbum = (album: MusicAlbum): CarRow => ({
  id: `album:${album.id}`,
  title: album.title,
  detail: album.artist.name,
  artwork: album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null,
  opens: false,
});

export { rowForAnAlbum };
