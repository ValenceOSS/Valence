import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { Library, MediaDetail, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail, ShowSummary } from '@ValenceContracts/schemas/Show';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import type { RefusalBody } from '@ValenceI18n/RefusalBody';
import type { ListItemsOptions } from '@ValenceServer/library/LibraryService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { JellyfinClient } from '@ValenceServer/jellyfin/JellyfinClient';

type JellyfinOrigin = {
  url: string;
  headers: Headers;
  client: JellyfinClient;
  send: (request: Request) => Promise<Response>;
};

type JellyfinProfile = { id: string; name: string; isOwner: boolean };

type JellyfinCaller = {
  token: string;
  origin: JellyfinOrigin;
  headers: Headers;
  viewer: Viewer;
  accountId: string;
  profile: JellyfinProfile;
  isAdministrator: boolean;
};

type JellyfinSignIn = {
  identifier: string;
  profileName: string | null;
  password: string;
};

type JellyfinRefused = {
  kind: 'refused';
  status: 401 | 403 | 404 | 422 | 429 | 500;
  refusal: RefusalBody;
};

type JellyfinSignedIn = { kind: 'signedIn'; caller: JellyfinCaller } | JellyfinRefused;

type JellyfinPlaybackAsk = {
  deviceProfile: DeviceProfile;
  startSeconds: number;
  audioStreamIndex: number | undefined;
  subtitleStreamIndex: number | undefined;
};

type JellyfinPlayback =
  | { kind: 'direct'; sessionId: string }
  | { kind: 'hls'; sessionId: string; ticket: string }
  | JellyfinRefused;

type JellyfinImage = { body: ArrayBuffer | Uint8Array; contentType: string };

type JellyfinBackend = {
  serverId: () => Promise<string>;
  serverName: () => Promise<string>;
  signIn: (asked: JellyfinSignIn, origin: JellyfinOrigin) => Promise<JellyfinSignedIn>;
  signOut: (caller: JellyfinCaller) => Promise<void>;
  callerOf: (token: string, origin: JellyfinOrigin) => Promise<JellyfinCaller | null>;
  libraries: (caller: JellyfinCaller) => Promise<Library[]>;
  listItems: (
    caller: JellyfinCaller,
    libraryIds: readonly string[],
    options: ListItemsOptions,
  ) => Promise<{ items: MediaSummary[]; total: number }>;
  listShows: (caller: JellyfinCaller, libraryId: string) => Promise<ShowSummary[]>;
  getShow: (
    caller: JellyfinCaller,
    libraryId: string,
    showId: string,
  ) => Promise<ShowDetail | null>;
  getMedia: (caller: JellyfinCaller, mediaId: string) => Promise<MediaDetail | null>;
  upNext: (caller: JellyfinCaller) => Promise<MediaSummary[]>;
  progress: (caller: JellyfinCaller) => Promise<WatchProgress[]>;
  favourites: (caller: JellyfinCaller) => Promise<string[]>;
  recordProgress: (
    caller: JellyfinCaller,
    mediaId: string,
    report: { positionSeconds: number; durationSeconds: number },
  ) => Promise<boolean>;
  forgetProgress: (caller: JellyfinCaller, mediaId: string) => Promise<boolean>;
  setFavourite: (caller: JellyfinCaller, mediaId: string, isFavourite: boolean) => Promise<boolean>;
  startPlayback: (
    caller: JellyfinCaller,
    mediaId: string,
    asked: JellyfinPlaybackAsk,
  ) => Promise<JellyfinPlayback>;
  stopPlayback: (caller: JellyfinCaller, sessionId: string) => Promise<void>;
  readSessionFile: (origin: JellyfinOrigin, ticket: string, name: string) => Promise<Response>;
  readDirectFile: (caller: JellyfinCaller, mediaId: string) => Promise<Response>;
  readArtwork: (name: string, width: number | null) => Promise<JellyfinImage | null>;
  readAvatar: (profileId: string) => Promise<JellyfinImage | null>;
};

export type {
  JellyfinBackend,
  JellyfinCaller,
  JellyfinImage,
  JellyfinOrigin,
  JellyfinPlayback,
  JellyfinPlaybackAsk,
  JellyfinProfile,
  JellyfinRefused,
  JellyfinSignIn,
  JellyfinSignedIn,
};
