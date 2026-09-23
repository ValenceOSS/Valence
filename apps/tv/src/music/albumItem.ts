import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

/**
 * An album as a tile: its cover, its name, and who made it.
 *
 * @param album - The album.
 * @returns The tile's item.
 */
const albumItem = (album: MusicAlbum): MusicItem => ({
  kind: 'album',
  id: album.id,
  title: album.title,
  detail: `${album.artist.name} • Album`,
  art: album.hasArtwork ? albumArtworkUrl(album.id) : null,
  view: { kind: 'album', id: album.id },
});

export { albumItem };
