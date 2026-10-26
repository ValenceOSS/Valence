import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { playlistArtworkUrl } from '@ValenceClient/music/fetchPlaylists';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import type { BookDetail } from '@ValenceContracts/schemas/Book';
import type { KeptListening } from '@ValenceContracts/schemas/KeptListening';
import type { AudioQuality, MusicAlbumDetail, MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PlaylistDetail } from '@ValenceContracts/schemas/Playlist';
import { say } from '@ValenceI18n/say';

type ListeningToKeep =
  | { kind: 'album'; detail: MusicAlbumDetail; quality: AudioQuality }
  | { kind: 'playlist'; detail: PlaylistDetail; quality: AudioQuality }
  | { kind: 'liked'; tracks: MusicTrack[]; quality: AudioQuality }
  | { kind: 'audiobook'; detail: BookDetail };

/**
 * What a device keeps of an album, a playlist, liked songs or an audiobook: everything it needs
 * to list it and play it with no server to ask.
 *
 * @param toKeep - What somebody asked to download, and at what quality.
 * @param keptAt - When.
 * @returns What to keep.
 */
const keptListeningOf = (toKeep: ListeningToKeep, keptAt = new Date()): KeptListening => {
  const common = {
    server: platformInUse().serverAddress(),
    profileId: null,
    keptAt: keptAt.toISOString(),
    book: null,
    chapters: [],
  };

  if (toKeep.kind === 'album') {
    const { album, tracks } = toKeep.detail;

    return {
      ...common,
      kind: 'album',
      id: album.id,
      title: album.title,
      byline: album.artist.name,
      artworkFrom: album.hasArtwork ? albumArtworkUrl(album.id) : null,
      quality: toKeep.quality,
      tracks,
    };
  }

  if (toKeep.kind === 'playlist') {
    const { playlist, entries } = toKeep.detail;
    const tracks = entries.flatMap((entry) =>
      entry.item?.track === null || entry.item?.track === undefined ? [] : [entry.item.track],
    );
    const firstAlbum = playlist.artworkAlbumIds[0];

    return {
      ...common,
      kind: 'playlist',
      id: playlist.id,
      title: playlist.name,
      byline: playlist.owner?.name ?? null,
      artworkFrom:
        playlistArtworkUrl(playlist) ??
        (firstAlbum === undefined ? null : albumArtworkUrl(firstAlbum)),
      quality: toKeep.quality,
      tracks,
    };
  }

  if (toKeep.kind === 'liked') {
    return {
      ...common,
      kind: 'liked',
      id: 'liked',
      title: say('common.likedSongs'),
      byline: null,
      artworkFrom: null,
      quality: toKeep.quality,
      tracks: toKeep.tracks,
    };
  }

  const { book, chapters } = toKeep.detail;

  return {
    ...common,
    kind: 'audiobook',
    id: book.id,
    title: book.title,
    byline: book.authors?.join(', ') ?? null,
    artworkFrom: book.hasCover ? bookCoverUrl(book.id) : null,
    quality: null,
    tracks: [],
    book,
    chapters: chapters.filter((chapter) => isAudiobookFormat(chapter.format)),
  };
};

export type { ListeningToKeep };

export { keptListeningOf };
