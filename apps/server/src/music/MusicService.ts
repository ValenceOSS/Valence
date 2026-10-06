import type {
  Lyrics,
  MusicAlbum,
  MusicAlbumDetail,
  MusicArtist,
  MusicArtistDetail,
  MusicTrack,
} from '@ValenceContracts/schemas/Music';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type AlbumOrder = 'recent' | 'title' | 'year';

type ListAlbumsOptions = {
  order?: AlbumOrder;
  limit?: number;
};

type ListArtistsOptions = {
  onlyFavourites?: boolean;
  limit?: number;
};

type TrackFile = {
  path: string;
  codec: string;
  container: string;
  isLossless: boolean;
  bitrateKbps: number | null;
};

type CatalogueSong = {
  id: string;
  albumId: string;
  year: number | null;
  genres: readonly string[];
  artists: readonly { id: string; name: string }[];
};

type MusicSearch = {
  tracks: MusicTrack[];
  albums: MusicAlbum[];
  artists: MusicArtist[];
};

type MusicService = {
  listAlbums: (viewer: Viewer, options?: ListAlbumsOptions) => Promise<MusicAlbum[]>;
  listArtists: (viewer: Viewer, options?: ListArtistsOptions) => Promise<MusicArtist[]>;
  readAlbum: (viewer: Viewer, albumId: string) => Promise<MusicAlbumDetail | null>;
  readArtist: (viewer: Viewer, artistId: string) => Promise<MusicArtistDetail | null>;
  listTracks: (viewer: Viewer, ids: readonly string[]) => Promise<MusicTrack[]>;
  listLiked: (viewer: Viewer) => Promise<MusicTrack[]>;
  listPicks: (viewer: Viewer, seedIds: readonly string[], limit: number) => Promise<MusicTrack[]>;
  listCatalogue: (viewer: Viewer) => Promise<CatalogueSong[]>;
  search: (viewer: Viewer, query: string) => Promise<MusicSearch>;
  readLyrics: (viewer: Viewer, trackId: string) => Promise<Lyrics | null>;
  readTrackFile: (viewer: Viewer, trackId: string) => Promise<TrackFile | null>;
  readAlbumArtwork: (viewer: Viewer, albumId: string) => Promise<string | null>;
  readArtistImage: (viewer: Viewer, artistId: string) => Promise<string | null>;
  keepArtist: (profileId: string, artistId: string) => Promise<boolean>;
  dropArtist: (profileId: string, artistId: string) => Promise<boolean>;
};

export type {
  AlbumOrder,
  CatalogueSong,
  ListAlbumsOptions,
  ListArtistsOptions,
  MusicSearch,
  MusicService,
  TrackFile,
};
