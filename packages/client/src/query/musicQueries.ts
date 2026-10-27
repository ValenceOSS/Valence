import { queryOptions } from '@tanstack/react-query';
import {
  fetchAlbum,
  fetchAlbums,
  fetchArtist,
  fetchArtistStory,
  fetchArtists,
  fetchLiked,
  fetchLyrics,
  fetchTracks,
  searchMusic,
} from '@ValenceClient/music/fetchMusic';
import { fetchPlaylist, fetchPlaylists } from '@ValenceClient/music/fetchPlaylists';
import { fetchMusicDevices } from '@ValenceClient/music/musicDevices';
import { fetchMix, fetchMixes } from '@ValenceClient/music/fetchMixes';
import { fetchMusicGenres } from '@ValenceClient/music/fetchMusicGenres';
import type { AlbumOrder } from '@ValenceClient/music/fetchMusic';
import { readEveryPage } from '@ValenceClient/query/readEveryPage';

const MOST_ALBUMS_ON_A_PAGE = 500;

const MOST_ARTISTS_ON_A_PAGE = 1000;

const STORY_KEPT_MS = 60 * 60 * 1000;
const MUSIC = ['music'] as const;

const PLAYLISTS = [...MUSIC, 'playlists'] as const;

/**
 * The albums in every music library this profile can see.
 *
 * @param order - Newest first, by title, or by year.
 * @returns The query, for every album, however many pages that takes.
 */
const albums = (order: AlbumOrder = 'recent') =>
  queryOptions({
    queryKey: [...MUSIC, 'albums', order],
    queryFn: () =>
      readEveryPage(
        async (offset, limit) => fetchAlbums(order, limit, offset),
        MOST_ALBUMS_ON_A_PAGE,
      ),
  });

/**
 * The artists this profile can see, or only the ones it follows.
 *
 * @param onlyFavourites - Whether to read only followed artists.
 * @returns The query, for every artist, however many pages that takes.
 */
const artists = (onlyFavourites = false) =>
  queryOptions({
    queryKey: [...MUSIC, 'artists', onlyFavourites ? 'followed' : 'all'],
    queryFn: () =>
      readEveryPage(
        async (offset, limit) => fetchArtists(onlyFavourites, limit, offset),
        MOST_ARTISTS_ON_A_PAGE,
      ),
  });

/**
 * One album and its tracks.
 *
 * @param albumId - The album.
 * @returns The query.
 */
const album = (albumId: string) =>
  queryOptions({ queryKey: [...MUSIC, 'album', albumId], queryFn: () => fetchAlbum(albumId) });

/**
 * One artist and everything of theirs.
 *
 * @param artistId - The artist.
 * @returns The query.
 */
const artist = (artistId: string) =>
  queryOptions({
    queryKey: [...MUSIC, 'artist', artistId],
    queryFn: () => fetchArtist(artistId),
  });

/**
 * What can be said about an artist beyond their songs in the library, which changes slowly enough
 * to keep for an hour.
 *
 * @param artistId - The artist.
 * @returns The query.
 */
const artistStory = (artistId: string) =>
  queryOptions({
    queryKey: [...MUSIC, 'artist', artistId, 'story'],
    queryFn: () => fetchArtistStory(artistId),
    staleTime: STORY_KEPT_MS,
  });

/**
 * Tracks by id, in order.
 *
 * @param ids - The tracks.
 * @returns The query.
 */
const tracks = (ids: readonly string[]) =>
  queryOptions({ queryKey: [...MUSIC, 'tracks', ...ids], queryFn: () => fetchTracks(ids) });

/**
 * The songs this profile has liked.
 *
 * @returns The query.
 */
const liked = () => queryOptions({ queryKey: [...MUSIC, 'liked'], queryFn: fetchLiked });

/**
 * What a search matched.
 *
 * @param query - What was typed.
 * @returns The query.
 */
const search = (query: string) =>
  queryOptions({
    queryKey: [...MUSIC, 'search', query],
    queryFn: () => searchMusic(query),
    enabled: query.trim() !== '',
  });

/**
 * A track's lyrics, kept for as long as a song lasts since they never change mid-listen.
 *
 * @param trackId - The track.
 * @returns The query.
 */
const lyrics = (trackId: string) =>
  queryOptions({
    queryKey: [...MUSIC, 'lyrics', trackId],
    queryFn: () => fetchLyrics(trackId),
    staleTime: 10 * 60 * 1000,
  });

/**
 * This profile's playlists and the shared ones.
 *
 * @returns The query.
 */
const playlists = () => queryOptions({ queryKey: [...PLAYLISTS, 'all'], queryFn: fetchPlaylists });

/**
 * One playlist and its entries.
 *
 * @param playlistId - The playlist.
 * @returns The query.
 */
const playlist = (playlistId: string) =>
  queryOptions({
    queryKey: [...PLAYLISTS, 'one', playlistId],
    queryFn: () => fetchPlaylist(playlistId),
  });

/**
 * Every open copy of Valence this profile has.
 *
 * @returns The query.
 */
const devices = () =>
  queryOptions({ queryKey: [...MUSIC, 'devices'], queryFn: () => fetchMusicDevices() });

/**
 * The mixes Valence has made for this profile today, which change once a day.
 *
 * @returns The query.
 */
const mixes = () =>
  queryOptions({ queryKey: [...MUSIC, 'mixes'], queryFn: fetchMixes, staleTime: 15 * 60_000 });

/**
 * One of today's mixes, with its songs. Not retried: a mix that is not there today is an answer.
 *
 * @param mixId - Which mix.
 * @returns The query.
 */
const mix = (mixId: string) =>
  queryOptions({
    queryKey: [...MUSIC, 'mixes', mixId],
    queryFn: () => fetchMix(mixId),
    staleTime: 15 * 60_000,
    retry: false,
  });

/**
 * The genres of the albums this profile can hear, for a smart playlist to choose among.
 *
 * @returns The query.
 */
const genres = () =>
  queryOptions({
    queryKey: [...MUSIC, 'genres'],
    queryFn: fetchMusicGenres,
    staleTime: 15 * 60_000,
  });

const musicQueries = {
  album,
  albums,
  artist,
  artistStory,
  artists,
  devices,
  genres,
  key: MUSIC,
  liked,
  lyrics,
  mix,
  mixes,
  playlist,
  playlists,
  playlistsKey: PLAYLISTS,
  search,
  tracks,
};

export { musicQueries };
