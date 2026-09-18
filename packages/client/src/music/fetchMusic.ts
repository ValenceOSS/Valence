import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import {
  LyricsSchema,
  MusicAlbumDetailSchema,
  MusicAlbumListSchema,
  MusicArtistDetailSchema,
  MusicArtistListSchema,
  MusicTrackListSchema,
} from '@ValenceContracts/schemas/Music';
import { MusicSearchSchema } from '@ValenceContracts/schemas/MusicSearch';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import type {
  AudioQuality,
  Lyrics,
  MusicAlbum,
  MusicAlbumDetail,
  MusicArtist,
  MusicArtistDetail,
  MusicTrack,
} from '@ValenceContracts/schemas/Music';
import type { MusicSearchResult } from '@ValenceContracts/schemas/MusicSearch';

type AlbumOrder = 'recent' | 'title' | 'year';

/**
 * Reads the albums in every music library this profile can see.
 *
 * @param order - Newest first, by title, or by year.
 * @returns The albums.
 */
const fetchAlbums = async (order: AlbumOrder = 'recent'): Promise<MusicAlbum[]> =>
  (await readFromServer(`/api/music/albums?order=${order}`, MusicAlbumListSchema, profileHeaders()))
    .albums;

/**
 * Reads the artists with an album this profile can see, or only the ones it follows.
 *
 * @param onlyFavourites - Whether to read only followed artists.
 * @returns The artists, alphabetically.
 */
const fetchArtists = async (onlyFavourites = false): Promise<MusicArtist[]> =>
  (
    await readFromServer(
      `/api/music/artists${onlyFavourites ? '?favourites=true' : ''}`,
      MusicArtistListSchema,
      profileHeaders(),
    )
  ).artists;

/**
 * Reads an album and its tracks in order.
 *
 * @param albumId - The album.
 * @returns The album.
 */
const fetchAlbum = (albumId: string): Promise<MusicAlbumDetail> =>
  readFromServer(`/api/music/albums/${albumId}`, MusicAlbumDetailSchema, profileHeaders());

/**
 * Reads an artist: their albums, what they appear on, and their best-loved songs.
 *
 * @param artistId - The artist.
 * @returns The artist.
 */
const fetchArtist = (artistId: string): Promise<MusicArtistDetail> =>
  readFromServer(`/api/music/artists/${artistId}`, MusicArtistDetailSchema, profileHeaders());

/**
 * Reads tracks by id, in the order asked for, leaving out any this profile may not hear.
 *
 * @param ids - The tracks.
 * @returns The tracks.
 */
const fetchTracks = async (ids: readonly string[]): Promise<MusicTrack[]> =>
  ids.length === 0
    ? []
    : (
        await readFromServer(
          `/api/music/tracks?ids=${ids.join(',')}`,
          MusicTrackListSchema,
          profileHeaders(),
        )
      ).tracks;

/**
 * Reads the songs this profile has liked, newest first.
 *
 * @returns The songs.
 */
const fetchLiked = async (): Promise<MusicTrack[]> =>
  (await readFromServer('/api/music/liked', MusicTrackListSchema, profileHeaders())).tracks;

/**
 * Searches songs, albums, artists and playlists.
 *
 * @param query - What was typed.
 * @returns What matched.
 */
const searchMusic = (query: string): Promise<MusicSearchResult> =>
  readFromServer(
    `/api/music/search?q=${encodeURIComponent(query)}`,
    MusicSearchSchema,
    profileHeaders(),
  );

/**
 * Reads a track's lyrics, or nothing where it has none.
 *
 * @param trackId - The track.
 * @returns The lyrics, or nothing.
 */
const fetchLyrics = async (trackId: string): Promise<Lyrics | null> => {
  try {
    return await readFromServer(
      `/api/music/tracks/${trackId}/lyrics`,
      LyricsSchema,
      profileHeaders(),
    );
  } catch (failure) {
    if (failure instanceof RequestFailed && failure.status === 404) {
      return null;
    }

    throw failure;
  }
};

/**
 * Follows or stops following an artist.
 *
 * @param artistId - The artist.
 * @param isFollowed - Whether to follow them.
 * @returns Whether the server took the change.
 */
const setArtistFollowed = async (artistId: string, isFollowed: boolean): Promise<boolean> => {
  const response = await fetch(`/api/music/artists/${artistId}/favourite`, {
    method: isFollowed ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
    headers: profileHeaders(),
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Where a track is streamed from at a quality.
 *
 * @param trackId - The track.
 * @param quality - How much of it to send.
 * @returns The address.
 */
const trackStreamUrl = (trackId: string, quality: AudioQuality): string =>
  `/api/music/tracks/${trackId}/stream?quality=${quality}`;

/**
 * Where an album's cover is read from.
 *
 * @param albumId - The album.
 * @returns The address.
 */
const albumArtworkUrl = (albumId: string): string => `/api/music/albums/${albumId}/artwork`;

/**
 * Where an artist's picture is read from.
 *
 * @param artistId - The artist.
 * @returns The address.
 */
const artistImageUrl = (artistId: string): string => `/api/music/artists/${artistId}/image`;

export type { AlbumOrder };

export {
  albumArtworkUrl,
  artistImageUrl,
  fetchAlbum,
  fetchAlbums,
  fetchArtist,
  fetchArtists,
  fetchLiked,
  fetchLyrics,
  fetchTracks,
  searchMusic,
  setArtistFollowed,
  trackStreamUrl,
};
