import type { SongToFind } from './findLyrics';

type AlbumToLookUp = {
  id: string;
  title: string;
  artistName: string;
  musicbrainzId: string | null;
};

type ArtistToLookUp = {
  id: string;
  name: string;
  hasImage: boolean;
};

type SongWithoutLyrics = SongToFind & { id: string };

type EnrichingStore = {
  albumsToLookUp: (libraryId: string, isAgain: boolean) => Promise<AlbumToLookUp[]>;
  markAlbumLookedUp: (albumId: string) => Promise<void>;
  artistsToLookUp: (libraryId: string, isAgain: boolean) => Promise<ArtistToLookUp[]>;
  markArtistLookedUp: (artistId: string) => Promise<void>;
  songsBy: (artistId: string) => Promise<{ id: string; title: string }[]>;
  setVideo: (trackId: string, videoKey: string) => Promise<void>;
  songsWithoutLyrics: (libraryId: string, isAgain: boolean) => Promise<SongWithoutLyrics[]>;
  keepFoundLyrics: (trackId: string, lyrics: string | null) => Promise<void>;
  setAlbumArtwork: (albumId: string, path: string) => Promise<void>;
  setArtistImage: (artistId: string, path: string) => Promise<void>;
};

export type { AlbumToLookUp, ArtistToLookUp, EnrichingStore, SongWithoutLyrics };
