import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type ServersFound = {
  alreadyFound: string[];
  reach: (address: string) => Promise<boolean>;
  whenFound: (listener: (address: string) => void) => () => void;
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

type AvailableUpdate = {
  version: string;
};

type UpdateChecks = {
  alreadyAvailable: AvailableUpdate | null;
  whenAvailable: (listener: (update: AvailableUpdate) => void) => () => void;
  install: () => void;
};

type AboutTheBuild = {
  version: string;
  commit: string;
  arch: string;
  electron: string;
  chrome: string;
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
      servers?: ServersFound;
    };
  }
}

export type {
  AboutTheBuild,
  AvailableUpdate,
  FilesHeld,
  Preferences,
  Reach,
  ServersFound,
  UpdateChecks,
};
