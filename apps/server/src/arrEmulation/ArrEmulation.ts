import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest, RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { SeerrSettings } from '@ValenceContracts/schemas/SeerrLink';

type ArrKind = 'film' | 'series';

type ArrLibrary = { id: string; name: string; path: string; freeBytes: number; totalBytes: number };

type ArrProfile = { id: string; name: string };

type ArrAsk = {
  kind: ArrKind;
  tmdbId: number;
  seasons: number[] | null;
  profileId: string | undefined;
  libraryId: string | undefined;
};

type ArrAsked =
  | { kind: 'asked'; request: MediaRequest }
  | { kind: 'refused'; status: 400 | 403 | 404 | 502 | 503; message: string };

type ArrEmulation = {
  readLink: () => Promise<SeerrSettings>;
  isRequestingOn: boolean;
  profiles: () => Promise<ArrProfile[]>;
  libraries: (kind: ArrKind) => Promise<ArrLibrary[]>;
  requests: () => Promise<MediaRequest[]>;
  downloads: () => Promise<QueuedDownload[]>;
  describe: (tmdbId: number, kind: ArrKind) => Promise<RequestCatalogue | null>;
  filmsHeld: (tmdbIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  seriesHeld: (tmdbIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  episodesHeld: (tmdbId: number) => Promise<ReadonlyMap<number, number>>;
  seriesOfTvdbId: (tvdbId: number) => Promise<number | null>;
  ask: (asked: ArrAsk) => Promise<ArrAsked>;
  withdraw: (request: MediaRequest) => Promise<void>;
};

export type { ArrAsk, ArrAsked, ArrEmulation, ArrKind, ArrLibrary, ArrProfile };
