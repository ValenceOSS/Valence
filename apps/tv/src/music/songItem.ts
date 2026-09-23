import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

/**
 * A song as a tile: its album's cover, its name, and who sings it. It stands for the song itself,
 * to be played, while its view is the album it is on.
 *
 * @param track - The song.
 * @returns The tile's item.
 */
const songItem = (track: MusicTrack): MusicItem => ({
  kind: 'song',
  id: track.id,
  title: track.title,
  detail: track.artists.map((artist) => artist.name).join(', '),
  art: track.album.hasArtwork ? albumArtworkUrl(track.album.id) : null,
  view: { kind: 'album', id: track.album.id },
});

export { songItem };
