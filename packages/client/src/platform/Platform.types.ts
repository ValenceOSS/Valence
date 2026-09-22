import type { Connect } from '@ValenceClient/realtime/createRealtimeClient';
import type { HeldFile, WhatToKeep } from '@ValenceContracts/schemas/HeldFile';

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

type ClientKind = 'browser' | 'desktop' | 'tv';

type BuildInfo = {
  version: string;
  commit: string;
  arch: string;
  electron: string;
  chrome: string;
};

type LocalNotice = {
  title: string;
  body: string;
  onOpen?: () => void;
};

type Platform = {
  store: DeviceStore;
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
};

export type { BuildInfo, ClientKind, DeviceStore, HeldFiles, LocalNotice, Platform, Reachability };
