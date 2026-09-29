import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { rowForAnAlbum } from '@ValenceMobile/carPlay/rowForAnAlbum';
import type { MusicArtistDetail } from '@ValenceContracts/schemas/Music';
import type { CarSection } from '@ValenceMobile/carPlay/NativeCarPlay.types';

const POPULAR_SHOWN = 10;

/**
 * What the car lists for one artist: their most played songs, then their albums.
 *
 * @param detail - The artist, their albums and their popular songs.
 * @returns The sections.
 */
const sectionsForAnArtist = (detail: MusicArtistDetail): CarSection[] => [
  {
    title: 'Popular',
    rows: detail.popular.slice(0, POPULAR_SHOWN).map((track, index) => ({
      id: `song:${detail.artist.id}:${index.toString()}`,
      title: track.title,
      detail: track.album.title,
      artwork: track.album.hasArtwork ? onThisServer(albumArtworkUrl(track.album.id)) : null,
      opens: false,
    })),
  },
  { title: 'Albums', rows: detail.albums.map(rowForAnAlbum) },
];

export { sectionsForAnArtist };
