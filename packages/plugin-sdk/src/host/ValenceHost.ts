type Scalar = string | number | boolean | null;

type Stored = Scalar | Stored[] | { [key: string]: Stored };

type MediaRef = {
  id: string;
  kind: 'film' | 'series' | 'episode' | 'artist' | 'album' | 'track' | 'book';
  title: string;
  year: number | null;
  seriesId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  durationSeconds: number | null;
  artist: string | null;
  album: string | null;
  externalIds: Partial<
    Record<'tmdb' | 'tvdb' | 'imdb' | 'anilist' | 'mal' | 'musicbrainz' | 'isrc', string>
  >;
};

type MediaDetails = MediaRef & {
  overview: string | null;
  genres: string[];
  communityRating: number | null;
  certificationAge: number | null;
  addedAt: string | null;
  albumId: string | null;
  artistId: string | null;
  discNumber: number | null;
  trackNumber: number | null;
  file: { container: string; sizeBytes: number; bitrateKbps: number | null } | null;
};

type LibraryPage = { items: MediaRef[]; next: string | null };

type ViewingState = {
  mediaId: string;
  isFavourite: boolean;
  stars: number | null;
  plays: number;
  lastPlayedAt: string | null;
};

type ProgressEntry = {
  mediaId: string;
  positionSeconds: number;
  durationSeconds: number;
  isFinished: boolean;
  updatedAt: string;
};

type MissingSong = {
  title: string;
  artist: string;
  album?: string | null;
  releaseId?: string | null;
};

type PlaylistContents = {
  id: string;
  name: string;
  entries: { entryId: string; mediaId: string | null; missing: MissingSong | null }[];
};

type CatalogueHit = {
  catalogueId: string;
  kind: 'film' | 'series' | 'album' | 'track';
  title: string;
  year: number | null;
  artist: string | null;
  isInLibrary: boolean;
  isRequested: boolean;
};

type Reading = { profileId: string };

type FetchInit = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  form?: Record<string, FormPart>;
};

type Fetched = { status: number; headers: Record<string, string> };

type JobOptions = { afterSeconds?: number; key?: string; profileId?: string };

type FormPart = string | { base64: string; fileName: string; contentType: string };

type ValenceHost = {
  plugin: { id: string; version: string };
  settings: { read: () => Promise<Record<string, string | boolean | number>> };
  log: {
    info: (message: string, detail?: Record<string, Scalar>) => void;
    warn: (message: string, detail?: Record<string, Scalar>) => void;
    error: (message: string, detail?: Record<string, Scalar>) => void;
  };
  storage: {
    get: (key: string) => Promise<Stored | null>;
    set: (key: string, value: Stored) => Promise<void>;
    delete: (key: string) => Promise<void>;
    keys: (prefix?: string) => Promise<string[]>;
  };
  secrets: {
    get: (profileId: string, key: string) => Promise<string | null>;
    set: (profileId: string, key: string, value: string) => Promise<void>;
    delete: (profileId: string, key: string) => Promise<void>;
    keys: (profileId: string) => Promise<string[]>;
  };
  events: {
    emit: (id: string, detail?: Record<string, string | number | boolean | null>) => Promise<void>;
  };
  jobs: {
    enqueue: (
      kind: string,
      payload?: Stored,
      options?: JobOptions,
    ) => Promise<{ id: string } | null>;
    progress: (processed: number, total: number) => Promise<void>;
  };
  crypto: {
    hmac: (
      algorithm: 'sha1' | 'sha256' | 'sha512',
      key: string,
      message: string,
      encoding?: 'hex' | 'base64',
    ) => Promise<string>;
    equal: (left: string, right: string) => Promise<boolean>;
    digest: (
      algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512',
      message: string,
      encoding?: 'hex' | 'base64',
      messageEncoding?: 'utf8' | 'base64',
    ) => Promise<string>;
    random: (bytes: number, encoding?: 'hex' | 'base64') => Promise<string>;
    verify: (
      algorithm: 'ed25519' | 'rsa-sha256' | 'ecdsa-sha256',
      publicKey: string,
      message: string,
      signature: string,
      signatureEncoding?: 'hex' | 'base64',
    ) => Promise<boolean>;
  };
  http: {
    fetch: (url: string, init?: FetchInit) => Promise<Fetched & { text: string }>;
    fetchBytes: (url: string, init?: FetchInit) => Promise<Fetched & { base64: string }>;
  };
  accounts: {
    connection: (
      profileId: string,
      provider: string,
    ) => Promise<{ accessToken: string; expiresAt: string | null; account: string | null } | null>;
    disconnect: (profileId: string, provider: string) => Promise<void>;
  };
  profiles: { list: () => Promise<{ id: string; name: string }[]> };
  library: {
    get: (mediaId: string, reading?: Reading) => Promise<MediaRef | null>;
    search: (query: string, kinds?: MediaRef['kind'][], reading?: Reading) => Promise<MediaRef[]>;
    findByExternalId: (
      source: keyof MediaRef['externalIds'],
      id: string,
      reading?: Reading,
    ) => Promise<MediaRef[]>;
    episodes: (seriesId: string, reading?: Reading) => Promise<MediaRef[]>;
    list: (
      ask: { kind: MediaRef['kind']; after?: string | undefined; limit?: number | undefined },
      reading?: Reading,
    ) => Promise<LibraryPage>;
    children: (id: string, reading?: Reading) => Promise<MediaRef[]>;
    details: (ids: string[], reading?: Reading) => Promise<MediaDetails[]>;
  };
  viewing: {
    progress: (profileId: string, since?: string) => Promise<ProgressEntry[]>;
    markWatched: (profileId: string, mediaId: string, watchedAt?: string) => Promise<void>;
    markUnwatched: (profileId: string, mediaId: string) => Promise<void>;
    state: (profileId: string, mediaIds: string[]) => Promise<ViewingState[]>;
  };
  requests: {
    searchCatalogue: (query: string, kind: CatalogueHit['kind']) => Promise<CatalogueHit[]>;
    create: (
      profileId: string,
      hit: Pick<CatalogueHit, 'catalogueId' | 'kind'>,
    ) => Promise<{ status: 'made' | 'already' | 'refused' }>;
    missingAlbums: (
      profileId: string,
      playlistId: string,
    ) => Promise<{ isMatching: boolean; albums: CatalogueHit[] } | null>;
  };
  playlists: {
    list: (profileId: string) => Promise<{ id: string; name: string }[]>;
    create: (
      profileId: string,
      playlist: { name: string; description?: string },
    ) => Promise<{ id: string }>;
    add: (profileId: string, playlistId: string, items: (string | MissingSong)[]) => Promise<void>;
    read: (profileId: string, playlistId: string) => Promise<PlaylistContents | null>;
    drop: (profileId: string, playlistId: string, entryId: string) => Promise<void>;
  };
  music: {
    findTrack: (
      track: {
        title: string;
        artist: string;
        album?: string;
        isrc?: string;
      },
      reading?: Reading,
    ) => Promise<MediaRef | null>;
  };
  notifications: {
    send: (profileId: string, note: { title: string; body: string }) => Promise<void>;
  };
};

export type {
  CatalogueHit,
  FetchInit,
  Fetched,
  FormPart,
  JobOptions,
  LibraryPage,
  MediaDetails,
  MediaRef,
  MissingSong,
  PlaylistContents,
  ProgressEntry,
  Reading,
  Scalar,
  Stored,
  ValenceHost,
  ViewingState,
};
