import { useQuery } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { albumItem } from '@ValenceTv/music/albumItem';
import { artistItem } from '@ValenceTv/music/artistItem';
import { LIKED_SONGS } from '@ValenceTv/music/LIKED_SONGS';
import { playlistItem } from '@ValenceTv/music/playlistItem';
import type { QueueSource } from '@ValenceClient/music/playQueue';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { MusicItem } from '@ValenceTv/music/MusicItem';
import type { ListenedView } from '@ValenceTv/music/ListenedView';

type Collection = {
  item: MusicItem;
  by: string | null;
  facts: string;
  tracks: readonly MusicTrack[];
  albums: readonly MusicItem[];
  source: QueueSource;
  isOrdered: boolean;
  showsAlbum: boolean;
};

/**
 * Says how long a list of songs lasts, as the web says it.
 *
 * @param tracks - The songs.
 * @returns How many there are and how long they last together.
 */
const lengthOf = (tracks: readonly MusicTrack[]): string => {
  const minutes = Math.round(tracks.reduce((all, track) => all + track.durationSeconds, 0) / 60);
  const songs = `${tracks.length.toString()} ${tracks.length === 1 ? 'song' : 'songs'}`;

  return minutes < 60
    ? `${songs}, ${minutes.toString()} min`
    : `${songs}, ${Math.floor(minutes / 60).toString()} hr ${(minutes % 60).toString()} min`;
};

/**
 * Reads what a page of the music section holds — an album, an artist, a playlist or somebody's
 * liked songs — as one shape: what it is, the songs on it, and, for an artist, their albums.
 *
 * @param view - The page.
 * @returns What it holds, or nothing while it is read.
 */
const useCollection = (view: ListenedView): Collection | null => {
  const album = useQuery({
    ...musicQueries.album(view.kind === 'album' ? view.id : ''),
    enabled: view.kind === 'album',
  });
  const artist = useQuery({
    ...musicQueries.artist(view.kind === 'artist' ? view.id : ''),
    enabled: view.kind === 'artist',
  });
  const playlist = useQuery({
    ...musicQueries.playlist(view.kind === 'playlist' ? view.id : ''),
    enabled: view.kind === 'playlist',
  });
  const liked = useQuery({ ...musicQueries.liked(), enabled: view.kind === 'liked' });

  if (view.kind === 'album' && album.data !== undefined) {
    const { tracks } = album.data;
    const item = albumItem(album.data.album);

    return {
      item,
      by: album.data.album.artist.name,
      facts: [album.data.album.year?.toString(), lengthOf(tracks)].filter(Boolean).join(' · '),
      tracks,
      albums: [],
      source: { kind: 'album', id: view.id, name: item.title },
      isOrdered: false,
      showsAlbum: false,
    };
  }

  if (view.kind === 'artist' && artist.data !== undefined) {
    const item = artistItem(artist.data.artist);

    return {
      item,
      by: null,
      facts: `${artist.data.artist.albumCount.toString()} albums · ${artist.data.artist.trackCount.toString()} songs`,
      tracks: artist.data.popular,
      albums: [...artist.data.albums, ...artist.data.appearsOn].map(albumItem),
      source: { kind: 'artist', id: view.id, name: item.title },
      isOrdered: false,
      showsAlbum: true,
    };
  }

  if (view.kind === 'playlist' && playlist.data !== undefined) {
    const tracks = playlist.data.entries.flatMap((entry) =>
      entry.item === null || entry.item.track === null ? [] : [entry.item.track],
    );
    const item = playlistItem(playlist.data.playlist);

    return {
      item,
      by: playlist.data.playlist.owner?.name ?? null,
      facts: lengthOf(tracks),
      tracks,
      albums: [],
      source: { kind: 'playlist', id: view.id, name: item.title },
      isOrdered: playlist.data.playlist.isOrdered,
      showsAlbum: true,
    };
  }

  if (view.kind === 'liked' && liked.data !== undefined) {
    return {
      item: LIKED_SONGS,
      by: null,
      facts: lengthOf(liked.data),
      tracks: liked.data,
      albums: [],
      source: { kind: 'liked', id: null, name: LIKED_SONGS.title },
      isOrdered: false,
      showsAlbum: true,
    };
  }

  return null;
};

export { useCollection };
