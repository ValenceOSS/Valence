import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';
import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';

type ServersFound = {
  alreadyFound: string[];
  reach: (address: string) => Promise<boolean>;
  whenFound: (listener: (address: string) => void) => () => void;
  alreadyNearby: NearbyValence[];
  whenNearbyChanges: (listener: (nearby: NearbyValence[]) => void) => () => void;
};

type Preferences = {
  held: Record<string, string>;
  write: (key: string, value: string) => void;
  forget: (key: string) => void;
};

type FilesHeld = {
  all: () => Promise<JsonValue>;
  keep: (what: JsonValue) => Promise<void>;
  drop: (downloadId: string) => Promise<void>;
  pause: (downloadId: string, isPaused: boolean) => Promise<void>;
  whenChanged: (listener: (held: JsonValue) => void) => () => void;
};

type Reach = {
  now: () => boolean;
  whenChanged: (listener: (isReachable: boolean) => void) => () => void;
};

type UpdateChecks = {
  now: () => DesktopUpdate;
  whenChanged: (listener: (update: DesktopUpdate) => void) => () => void;
  download: () => void;
};

type AboutTheBuild = {
  version: string;
  commit: string;
  arch: string;
  electron: string;
  chrome: string;
};

type DesktopNotifications = {
  setBadge: (count: number) => void;
};

declare global {
  interface Window {
    valence: {
      preferences: Preferences;
      goToTheServer: () => void;
      held: FilesHeld;
      reach: Reach;
      update: UpdateChecks;
      about: AboutTheBuild;
      notifications: DesktopNotifications;
      servers?: ServersFound;
    };
  }
}

export type {
  AboutTheBuild,
  DesktopNotifications,
  FilesHeld,
  Preferences,
  Reach,
  ServersFound,
  UpdateChecks,
};
