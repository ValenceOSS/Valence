import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aTrack } from '@ValenceClient/testing/aTrack';
import type { BookChapter } from '@ValenceContracts/schemas/Book';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type {
  PlaylistDetail,
  PlaylistEntry,
  PlaylistSummary,
} from '@ValenceContracts/schemas/Playlist';
import { keptListeningOf } from './keptListeningOf';

const SERVER = 'https://valence.example';

const KEPT_AT = new Date('2026-10-01T00:00:00.000Z');

const AN_ALBUM: MusicAlbum = {
  id: '00000000-0000-4000-8000-00000000a1b1',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Even In Arcadia',
  artist: { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
  year: 2025,
  genres: [],
  hasArtwork: true,
  isCompilation: false,
  trackCount: 2,
  durationSeconds: 403,
  sizeBytes: 0,
  isExplicit: false,
  addedAt: '2026-09-01T00:00:00.000Z',
};

const A_PLAYLIST: PlaylistSummary = {
  id: '00000000-0000-4000-8000-0000000000b1',
  name: 'Late',
  description: null,
  isShared: false,
  isOrdered: true,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-0000000000c1', name: 'Pat', colour: '#000000' },
  entryCount: 3,
  lostCount: 1,
  missingCount: 1,
  durationSeconds: 403,
  artworkAlbumIds: [AN_ALBUM.id],
  hasOwnArtwork: false,
  updatedAt: '2026-09-01T00:00:00.000Z',
};

/**
 * An entry in a playlist, holding a song or holding nothing.
 *
 * @param n - Which entry.
 * @param track - The song, or nothing where it was lost.
 * @returns The entry.
 */
const anEntry = (n: number, track: ReturnType<typeof aTrack> | null): PlaylistEntry => ({
  id: `00000000-0000-4000-8000-0000000000e${n.toString()}`,
  position: n,
  addedAt: '2026-09-01T00:00:00.000Z',
  item: {
    id: `00000000-0000-4000-8000-0000000000d${n.toString()}`,
    kind: 'song',
    title: `Entry ${n.toString()}`,
    subtitle: null,
    durationSeconds: 200,
    track,
  },
  missing: null,
});

const A_PLAYLIST_DETAIL: PlaylistDetail = {
  playlist: A_PLAYLIST,
  entries: [anEntry(1, aTrack(1)), anEntry(2, null), { ...anEntry(3, null), item: null }],
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => SERVER }));
});

describe('keptListeningOf', () => {
  it('keeps an album with its songs, its artist and its cover, for the server in use', () => {
    expect(
      keptListeningOf(
        {
          kind: 'album',
          detail: { album: AN_ALBUM, tracks: [aTrack(1), aTrack(2)] },
          quality: 'normal',
        },
        KEPT_AT,
      ),
    ).toEqual({
      kind: 'album',
      id: AN_ALBUM.id,
      title: 'Even In Arcadia',
      byline: 'Sleep Token',
      artworkFrom: `/api/music/albums/${AN_ALBUM.id}/artwork`,
      quality: 'normal',
      tracks: [aTrack(1), aTrack(2)],
      book: null,
      chapters: [],
      server: SERVER,
      profileId: null,
      keptAt: '2026-10-01T00:00:00.000Z',
    });
  });

  it('keeps no cover for an album with none', () => {
    expect(
      keptListeningOf({
        kind: 'album',
        detail: { album: { ...AN_ALBUM, hasArtwork: false }, tracks: [] },
        quality: 'high',
      }).artworkFrom,
    ).toBeNull();
  });

  it('keeps a playlist with only the entries that are songs, and its owner', () => {
    expect(
      keptListeningOf({ kind: 'playlist', detail: A_PLAYLIST_DETAIL, quality: 'high' }, KEPT_AT),
    ).toMatchObject({
      kind: 'playlist',
      id: A_PLAYLIST.id,
      title: 'Late',
      byline: 'Pat',
      quality: 'high',
      tracks: [aTrack(1)],
      server: SERVER,
    });
  });

  it('borrows the first album’s cover for a playlist with none of its own', () => {
    expect(
      keptListeningOf({ kind: 'playlist', detail: A_PLAYLIST_DETAIL, quality: 'high' }).artworkFrom,
    ).toBe(`/api/music/albums/${AN_ALBUM.id}/artwork`);
  });

  it('keeps a playlist’s own cover where it has one', () => {
    const playlist = { ...A_PLAYLIST, hasOwnArtwork: true };

    expect(
      keptListeningOf({
        kind: 'playlist',
        detail: { ...A_PLAYLIST_DETAIL, playlist },
        quality: 'high',
      }).artworkFrom,
    ).toBe(`/api/playlists/${A_PLAYLIST.id}/artwork?v=${encodeURIComponent(A_PLAYLIST.updatedAt)}`);
  });

  it('keeps no cover, and nobody’s name, for a playlist with neither', () => {
    expect(
      keptListeningOf({
        kind: 'playlist',
        detail: {
          ...A_PLAYLIST_DETAIL,
          playlist: { ...A_PLAYLIST, artworkAlbumIds: [], owner: null },
        },
        quality: 'high',
      }),
    ).toMatchObject({ artworkFrom: null, byline: null });
  });

  it('keeps liked songs under one name, with no cover', () => {
    expect(
      keptListeningOf({ kind: 'liked', tracks: [aTrack(1)], quality: 'lossless' }, KEPT_AT),
    ).toMatchObject({
      kind: 'liked',
      id: 'liked',
      title: 'Liked songs',
      byline: null,
      artworkFrom: null,
      quality: 'lossless',
      tracks: [aTrack(1)],
    });
  });

  it('keeps an audiobook with its authors, its cover and only what can be heard of it', () => {
    const detail = anAudiobook({ authors: ['Pierce Brown', 'Somebody Else'] });
    const pages: BookChapter = {
      id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0c09',
      bookId: detail.book.id,
      number: 3,
      title: 'The text',
      format: 'epub',
      pageCount: 40,
      addedAt: detail.book.addedAt,
    };
    const kept = keptListeningOf(
      { kind: 'audiobook', detail: { ...detail, chapters: [...detail.chapters, pages] } },
      KEPT_AT,
    );

    expect(kept).toMatchObject({
      kind: 'audiobook',
      id: detail.book.id,
      title: 'Red Rising',
      byline: 'Pierce Brown, Somebody Else',
      artworkFrom: `/api/books/${detail.book.id}/cover`,
      quality: null,
      tracks: [],
      book: detail.book,
      server: SERVER,
    });
    expect(kept.chapters).toEqual(detail.chapters);
  });

  it('keeps an audiobook with no authors or cover as it is', () => {
    expect(
      keptListeningOf({
        kind: 'audiobook',
        detail: anAudiobook({ authors: null, hasCover: false }),
      }),
    ).toMatchObject({ byline: null, artworkFrom: null });
  });
});
