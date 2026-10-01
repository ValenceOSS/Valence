type Scalar = string | number | boolean | null;

type Stored = Scalar | Stored[] | { [key: string]: Stored };

type MediaRef = {
  id: string;
  kind: 'film' | 'series' | 'episode' | 'album' | 'track' | 'book';
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

type ProgressEntry = {
  mediaId: string;
  positionSeconds: number;
  durationSeconds: number;
  isFinished: boolean;
  updatedAt: string;
};

type PlaylistContents = {
  id: string;
  name: string;
  entries: { entryId: string; mediaId: string | null }[];
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

type TranscodeTarget = {
  quality: '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p';
  videoCodec: 'h264' | 'hevc' | 'av1';
  container: 'mp4' | 'mkv';
  maxBitrateKbps: number | null;
  audio: 'keep' | 'compress';
};

type KeptCopy = {
  id: string;
  quality: string | null;
  container: string;
  videoCodec: string;
  width: number | null;
  height: number | null;
  bitrateKbps: number;
  sizeBytes: number;
  fileName: string;
};

type TranscodeCandidate = {
  mediaId: string;
  kind: 'film' | 'episode';
  title: string;
  seriesTitle: string | null;
  width: number;
  height: number;
  videoCodec: string;
  bitrateKbps: number;
  sizeBytes: number;
  durationSeconds: number;
  copies: KeptCopy[];
};

type TranscodeQueued = {
  requestId: string;
  mediaId: string;
  title: string;
  state: 'queued' | 'encoding' | 'verifying';
  progress: number;
};

type TranscodeOutcome =
  { status: 'queued'; requestId: string } | { status: 'refused'; code: string; reason: string };

type ClockReading = {
  iso: string;
  timeZone: string;
  weekday: number;
  hour: number;
  minute: number;
};

type ValenceHost = {
  plugin: { id: string; version: string };
  settings: { read: () => Promise<Record<string, string | boolean>> };
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
  events: {
    emit: (id: string, detail?: Record<string, string | number | boolean | null>) => Promise<void>;
  };
  crypto: {
    hmac: (
      algorithm: 'sha1' | 'sha256' | 'sha512',
      key: string,
      message: string,
      encoding?: 'hex' | 'base64',
    ) => Promise<string>;
    equal: (left: string, right: string) => Promise<boolean>;
  };
  http: {
    fetch: (
      url: string,
      init?: {
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        headers?: Record<string, string>;
        body?: string;
      },
    ) => Promise<{ status: number; headers: Record<string, string>; text: string }>;
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
    get: (mediaId: string) => Promise<MediaRef | null>;
    search: (query: string, kinds?: MediaRef['kind'][]) => Promise<MediaRef[]>;
    findByExternalId: (source: keyof MediaRef['externalIds'], id: string) => Promise<MediaRef[]>;
    episodes: (seriesId: string) => Promise<MediaRef[]>;
  };
  viewing: {
    progress: (profileId: string, since?: string) => Promise<ProgressEntry[]>;
    markWatched: (profileId: string, mediaId: string, watchedAt?: string) => Promise<void>;
    markUnwatched: (profileId: string, mediaId: string) => Promise<void>;
  };
  requests: {
    searchCatalogue: (query: string, kind: CatalogueHit['kind']) => Promise<CatalogueHit[]>;
    create: (
      profileId: string,
      hit: Pick<CatalogueHit, 'catalogueId' | 'kind'>,
    ) => Promise<{ status: 'made' | 'already' | 'refused' }>;
  };
  playlists: {
    list: (profileId: string) => Promise<{ id: string; name: string }[]>;
    create: (
      profileId: string,
      playlist: { name: string; description?: string },
    ) => Promise<{ id: string }>;
    add: (profileId: string, playlistId: string, mediaIds: string[]) => Promise<void>;
    read: (profileId: string, playlistId: string) => Promise<PlaylistContents | null>;
    drop: (profileId: string, playlistId: string, entryId: string) => Promise<void>;
  };
  music: {
    findTrack: (track: {
      title: string;
      artist: string;
      album?: string;
      isrc?: string;
    }) => Promise<MediaRef | null>;
  };
  notifications: {
    send: (profileId: string, note: { title: string; body: string }) => Promise<void>;
  };
  transcoding: {
    candidates: (page: {
      after: string | null;
      limit: number;
    }) => Promise<{ items: TranscodeCandidate[]; next: string | null }>;
    keep: (mediaId: string, target: TranscodeTarget) => Promise<TranscodeOutcome>;
    underWay: () => Promise<TranscodeQueued[]>;
    cancel: (requestId: string) => Promise<void>;
    removeCopy: (copyId: string) => Promise<void>;
  };
  clock: { now: () => Promise<ClockReading> };
};

export type {
  CatalogueHit,
  ClockReading,
  KeptCopy,
  MediaRef,
  PlaylistContents,
  ProgressEntry,
  Scalar,
  Stored,
  TranscodeCandidate,
  TranscodeOutcome,
  TranscodeQueued,
  TranscodeTarget,
  ValenceHost,
};
