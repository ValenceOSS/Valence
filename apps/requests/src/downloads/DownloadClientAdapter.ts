import type { QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';

type ClientItem = {
  remoteId: string;
  title: string;
  state: QueuedDownloadState;
  problem: string | null;
  progress: number;
  sizeBytes: number | null;
  doneBytes: number | null;
  downloadBytesPerSecond: number | null;
  uploadBytesPerSecond: number | null;
  secondsLeft: number | null;
  seeds: number | null;
  peers: number | null;
  path: string | null;
};

type ClientSpeeds = {
  downloadBytesPerSecond: number | null;
  uploadBytesPerSecond: number | null;
};

type ClientSettings = {
  name: string;
  url: string;
  username: string;
  password: string;
  apiKey: string;
  categories: readonly string[];
};

type ClientFetch = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string | FormData;
    signal: AbortSignal;
  },
) => Promise<Response>;

type DownloadClientAdapter = {
  version: () => Promise<string>;
  add: (file: ReleaseFile, title: string, category: string) => Promise<string>;
  list: () => Promise<ClientItem[]>;
  speeds: () => Promise<ClientSpeeds>;
  pause: (remoteId: string) => Promise<void>;
  resume: (remoteId: string) => Promise<void>;
  remove: (remoteId: string, deleteData: boolean) => Promise<void>;
};

export type { ClientFetch, ClientItem, ClientSettings, ClientSpeeds, DownloadClientAdapter };
