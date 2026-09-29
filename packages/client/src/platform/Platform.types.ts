import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import type { Connect } from '@ValenceClient/realtime/createRealtimeClient';
import type { HeldFile, WhatToKeep } from '@ValenceContracts/schemas/HeldFile';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { PasskeyAssertion } from '@ValenceContracts/schemas/PasskeyAssertion';
import type { PasskeyAttestation } from '@ValenceContracts/schemas/PasskeyAttestation';
import type { PasskeyCreationOptions } from '@ValenceContracts/schemas/PasskeyCreationOptions';
import type { PasskeyRequestOptions } from '@ValenceContracts/schemas/PasskeyRequestOptions';

type DeviceStore = {
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  forget: (key: string) => void;
};

type HeldFiles = {
  all: () => Promise<HeldFile[]>;
  keep: (what: WhatToKeep) => Promise<void>;
  drop: (downloadId: string) => Promise<void>;
  pause: (downloadId: string, isPaused: boolean) => Promise<void>;
  sourceFor: (downloadId: string) => string;
  posterFor: (downloadId: string) => string;
  whenChanged: (listener: (held: HeldFile[]) => void) => () => void;
};

type Reachability = {
  isReachable: () => boolean;
  whenChanged: (listener: (isReachable: boolean) => void) => () => void;
};

type BuildInfo = {
  version: string;
  commit: string | null;
  runsOn: string;
};

type LocalNotice = {
  title: string;
  body: string;
  onOpen?: () => void;
};

type MusicAudio = {
  audio: AudioLike;
  canPlay: (type: string) => boolean;
};

type PasskeyHandOff = 'in' | 'cancelled' | 'failed';

type Passkeys =
  | { kind: 'in-the-page' }
  | {
      kind: 'through-the-system';
      ask: (options: PasskeyRequestOptions) => Promise<PasskeyAssertion | null>;
      make: (options: PasskeyCreationOptions) => Promise<PasskeyAttestation | null>;
    }
  | {
      kind: 'through-a-sign-in-page';
      signIn: (profileId: string | null) => Promise<PasskeyHandOff>;
      addOne: () => void;
    }
  | { kind: 'none'; why: string };

type Platform = {
  store: DeviceStore;
  serverAddress: () => string | null;
  describeThisClient: () => string;
  thisClientId: () => string;
  thisClientKind: () => ClientKind;
  canKeepFiles: () => boolean;
  held: HeldFiles;
  reachability: Reachability;
  openSocket: Connect;
  buildInfo: () => BuildInfo | null;
  notifyLocally: (notice: LocalNotice) => void;
  setUnreadBadge: (count: number) => void;
  musicAudio: () => MusicAudio;
  listeningAudio: () => ListeningAudio;
  passkeys: () => Passkeys;
};

export type {
  BuildInfo,
  ClientKind,
  DeviceStore,
  HeldFiles,
  LocalNotice,
  MusicAudio,
  PasskeyHandOff,
  Passkeys,
  Platform,
  Reachability,
};
