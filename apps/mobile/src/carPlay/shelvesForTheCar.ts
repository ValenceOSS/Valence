import { artistImageUrl, albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { playlistArtworkUrl } from '@ValenceClient/music/fetchPlaylists';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { rowForAnAlbum } from '@ValenceMobile/carPlay/rowForAnAlbum';
import type { MusicAlbum, MusicArtist, MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { CarRow, CarShelf } from '@ValenceMobile/carPlay/NativeCarPlay.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const NEWEST_SHOWN = 12;

const MOST_SHOWN = 100;

/**
 * Where a playlist's picture is read from: its own cover, or the first album in it.
 *
 * @param playlist - The playlist.
 * @returns The whole address, or nothing where it has neither.
 */
const pictureOfAPlaylist = (playlist: PlaylistSummary): string | null => {
  const own = playlistArtworkUrl(playlist);
  const first = playlist.artworkAlbumIds[0];

  if (own !== null) {
    return onThisServer(own);
  }

  return first === undefined ? null : onThisServer(albumArtworkUrl(first));
};

/**
 * Where an artist's picture is read from: their own, or one of their albums'.
 *
 * @param artist - The artist.
 * @returns The whole address, or nothing where there is neither.
 */
const pictureOfAnArtist = (artist: MusicArtist): string | null => {
  if (artist.hasImage) {
    return onThisServer(artistImageUrl(artist.id));
  }

  return artist.imageAlbumId === null ? null : onThisServer(albumArtworkUrl(artist.imageAlbumId));
};

/**
 * The tabs the car shows along its foot: something to play straight away, then every playlist,
 * album and artist this profile has, each list as the phone's own library orders it.
 *
 * @param music - What this profile has.
 * @param music.liked - Their liked songs.
 * @param music.newest - Their albums, newest first.
 * @param music.albums - Their albums, by title.
 * @param music.playlists - Their playlists.
 * @param music.artists - Their artists.
 * @returns The tabs.
 */
const shelvesForTheCar = (music: {
  liked: readonly MusicTrack[];
  newest: readonly MusicAlbum[];
  albums: readonly MusicAlbum[];
  playlists: readonly PlaylistSummary[];
  artists: readonly MusicArtist[];
}): CarShelf[] => {
  const likedCover = music.liked.find((track) => track.album.hasArtwork)?.album.id;
  const liked: CarRow = {
    id: 'liked',
    title: say('common.likedSongs'),
    detail: sayCount('common.count.songs', music.liked.length),
    artwork: likedCover === undefined ? null : onThisServer(albumArtworkUrl(likedCover)),
    opens: false,
  };

  return [
    {
      id: 'listen',
      title: say('phone.carPlay.shelvesForTheCar.listenNow'),
      symbol: 'play.circle',
      sections: [
        { title: null, rows: music.liked.length === 0 ? [] : [liked] },
        {
          title: say('common.recentlyAdded'),
          rows: music.newest.slice(0, NEWEST_SHOWN).map(rowForAnAlbum),
        },
      ],
    },
    {
      id: 'playlists',
      title: say('common.playlists'),
      symbol: 'music.note.list',
      sections: [
        {
          title: null,
          rows: music.playlists.slice(0, MOST_SHOWN).map((playlist) => ({
            id: `playlist:${playlist.id}`,
            title: playlist.name,
            detail: sayCount('common.count.songs', playlist.entryCount),
            artwork: pictureOfAPlaylist(playlist),
            opens: false,
          })),
        },
      ],
    },
    {
      id: 'albums',
      title: say('common.albums'),
      symbol: 'square.stack',
      sections: [{ title: null, rows: music.albums.slice(0, MOST_SHOWN).map(rowForAnAlbum) }],
    },
    {
      id: 'artists',
      title: say('common.artists'),
      symbol: 'music.mic',
      sections: [
        {
          title: null,
          rows: music.artists.slice(0, MOST_SHOWN).map((artist) => ({
            id: `artist:${artist.id}`,
            title: artist.name,
            detail: sayCount('common.count.albums', artist.albumCount),
            artwork: pictureOfAnArtist(artist),
            opens: true,
          })),
        },
      ],
    },
  ];
};

export { shelvesForTheCar };
