import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { MediaImportKind } from '@ValenceContracts/schemas/MediaImport';
import type { SegmentKind } from '@ValenceContracts/schemas/MediaSegment';

type SourceIdentity = {
  kind: MediaImportKind;
  serverId: string;
  name: string;
  version: string;
};

type SourceIds = {
  tmdb: string | null;
  imdb: string | null;
  tvdb: string | null;
  musicBrainzTrack: string | null;
  musicBrainzAlbum: string | null;
  musicBrainzReleaseGroup: string | null;
  musicBrainzArtist: string | null;
};

type SourceLibraryAccess = { kind: 'all' } | { kind: 'only'; libraryIds: readonly string[] };

type SourceCeiling = {
  maximumAge: number;
  allowsUnrated: boolean;
};

type SourceUser = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  isAdministrator: boolean;
  isDisabled: boolean;
  access: 'readable' | 'needsPin' | 'unreadable';
  libraryAccess: SourceLibraryAccess;
  ceiling: SourceCeiling | null;
  avatarUrl: string | null;
};

type SourceLibrary = {
  id: string;
  name: string;
  kind: LibraryKind | null;
  locations: readonly string[];
};

type SourceItemKind = 'movie' | 'series' | 'episode' | 'artist' | 'album' | 'track' | 'other';

type SourceItem = {
  id: string;
  kind: SourceItemKind;
  libraryId: string | null;
  title: string;
  year: number | null;
  path: string | null;
  ids: SourceIds;
  seriesId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  albumId: string | null;
  discNumber: number | null;
  trackNumber: number | null;
  durationSeconds: number | null;
  addedAt: Date | null;
};

type SourceUserState = {
  itemId: string;
  isPlayed: boolean;
  playCount: number;
  lastPlayedAt: Date | null;
  positionSeconds: number;
  isFavourite: boolean;
  rating: number | null;
};

type SourcePlay = {
  key: string;
  itemId: string;
  at: Date;
};

type SourceArtist = {
  name: string;
  musicBrainzId: string | null;
};

type SourceCollection = {
  id: string;
  name: string;
  description: string | null;
  itemIds: readonly string[];
};

type SourcePlaylist = {
  id: string;
  name: string;
  isShared: boolean;
  itemIds: readonly string[];
};

type SourceMarker = {
  kind: SegmentKind;
  startSeconds: number;
  endSeconds: number;
};

type SourcePicture = {
  body: Uint8Array;
  contentType: string;
};

type SourceReader = {
  identify: () => Promise<SourceIdentity>;
  users: () => Promise<SourceUser[]>;
  libraries: () => Promise<SourceLibrary[]>;
  items: (library: SourceLibrary) => Promise<SourceItem[]>;
  userStates: (user: SourceUser) => Promise<SourceUserState[]>;
  plays: (user: SourceUser) => Promise<SourcePlay[]>;
  favouriteArtists: (user: SourceUser) => Promise<SourceArtist[]>;
  collections: () => Promise<SourceCollection[]>;
  playlists: (users: readonly SourceUser[]) => Promise<Map<string, SourcePlaylist[]>>;
  markers: (item: SourceItem) => Promise<SourceMarker[]>;
  avatar: (user: SourceUser) => Promise<SourcePicture | null>;
};

export type {
  SourceArtist,
  SourceCeiling,
  SourceCollection,
  SourceIdentity,
  SourceIds,
  SourceItem,
  SourceItemKind,
  SourceLibrary,
  SourceLibraryAccess,
  SourceMarker,
  SourcePicture,
  SourcePlay,
  SourcePlaylist,
  SourceReader,
  SourceUser,
  SourceUserState,
};
