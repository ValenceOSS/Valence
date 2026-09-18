import { queryOptions } from '@tanstack/react-query';
import {
  fetchAlbum,
  fetchAlbums,
  fetchArtist,
  fetchArtists,
  fetchLiked,
  fetchLyrics,
  fetchTracks,
  searchMusic,
} from '@ValenceClient/music/fetchMusic';
import { fetchPlaylist, fetchPlaylists } from '@ValenceClient/music/fetchPlaylists';
import { fetchMusicDevices } from '@ValenceClient/music/musicDevices';
import type { AlbumOrder } from '@ValenceClient/music/fetchMusic';

const MUSIC = ['music'] as const;

const PLAYLISTS = [...MUSIC, 'playlists'] as const;

/**
 * The albums in every music library this profile can see.
 *
 * @param order - Newest first, by title, or by year.
 * @returns The query.
 */
const albums = (order: AlbumOrder = 'recent') =>
  queryOptions({ queryKey: [...MUSIC, 'albums', order], queryFn: () => fetchAlbums(order) });

/**
 * The artists this profile can see, or only the ones it follows.
 *
 * @param onlyFavourites - Whether to read only followed artists.
 * @returns The query.
 */
const artists = (onlyFavourites = false) =>
  queryOptions({
    queryKey: [...MUSIC, 'artists', onlyFavourites ? 'followed' : 'all'],
    queryFn: () => fetchArtists(onlyFavourites),
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
const devices = () => queryOptions({ queryKey: [...MUSIC, 'devices'], queryFn: fetchMusicDevices });

const musicQueries = {
  album,
  albums,
  artist,
  artists,
  devices,
  key: MUSIC,
  liked,
  lyrics,
  playlist,
  playlists,
  playlistsKey: PLAYLISTS,
  search,
  tracks,
};

export { musicQueries };
