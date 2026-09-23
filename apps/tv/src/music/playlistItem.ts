import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

/**
 * A playlist as a tile: the cover of the first album on it, and whose it is.
 *
 * @param playlist - The playlist.
 * @returns The tile's item.
 */
const playlistItem = (playlist: PlaylistSummary): MusicItem => {
  const cover = playlist.artworkAlbumIds[0];

  return {
    kind: 'playlist',
    id: playlist.id,
    title: playlist.name,
    detail:
      playlist.isMine || playlist.owner === null ? 'Playlist' : `Playlist • ${playlist.owner.name}`,
    art: cover === undefined ? null : albumArtworkUrl(cover),
    view: { kind: 'playlist', id: playlist.id },
  };
};

export { playlistItem };
