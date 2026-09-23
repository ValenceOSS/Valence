import { fetchAlbum, fetchArtist, fetchLiked } from '@ValenceClient/music/fetchMusic';
import { fetchPlaylist } from '@ValenceClient/music/fetchPlaylists';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { QueueSource } from '@ValenceClient/music/playQueue';
import type { MusicView } from '@ValenceClient/music/musicView';

type Playable = {
  tracks: MusicTrack[];
  source: QueueSource;
  isOrdered: boolean;
};

/**
 * The songs a page of the music section would play, fetched without opening it: an album's songs
 * in order, a playlist's, an artist's most played, or everything somebody likes.
 *
 * @param view - The page.
 * @param name - What the page is called, for saying where the music came from.
 * @returns The songs and where they came from, or nothing for a page that is not a list of songs.
 */
const tracksFor = async (view: MusicView, name: string): Promise<Playable | null> => {
  if (view.kind === 'album') {
    const read = await fetchAlbum(view.id);

    return { tracks: read.tracks, source: { kind: 'album', id: view.id, name }, isOrdered: false };
  }

  if (view.kind === 'artist') {
    const read = await fetchArtist(view.id);

    return {
      tracks: read.popular,
      source: { kind: 'artist', id: view.id, name },
      isOrdered: false,
    };
  }

  if (view.kind === 'playlist') {
    const read = await fetchPlaylist(view.id);

    return {
      tracks: read.entries.flatMap((entry) =>
        entry.item === null || entry.item.track === null ? [] : [entry.item.track],
      ),
      source: { kind: 'playlist', id: view.id, name },
      isOrdered: read.playlist.isOrdered,
    };
  }

  if (view.kind === 'liked') {
    return {
      tracks: await fetchLiked(),
      source: { kind: 'liked', id: null, name },
      isOrdered: false,
    };
  }

  return null;
};

export type { Playable };

export { tracksFor };
