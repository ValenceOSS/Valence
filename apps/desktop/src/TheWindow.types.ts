import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';
import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';
import type { PasskeyCreationOptions } from '@ValenceContracts/schemas/PasskeyCreationOptions';
import type { PasskeyRequestOptions } from '@ValenceContracts/schemas/PasskeyRequestOptions';
import type { AskReply } from '@ValenceDesktop/main/AskReply';
import type { HandBackReply } from '@ValenceDesktop/main/HandBackReply';
import type { MakeReply } from '@ValenceDesktop/main/MakeReply';

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

type DesktopPasskeys = {
  way: 'system' | 'page';
  ask: (options: PasskeyRequestOptions) => Promise<AskReply>;
  make: (options: PasskeyCreationOptions) => Promise<MakeReply>;
  signInOnAPage: (challenge: string, profileId: string | null) => Promise<HandBackReply>;
  addOneInTheBrowser: () => void;
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
      passkeys: DesktopPasskeys;
      servers?: ServersFound;
    };
  }
}

export type {
  AboutTheBuild,
  DesktopNotifications,
  DesktopPasskeys,
  FilesHeld,
  Preferences,
  Reach,
  ServersFound,
  UpdateChecks,
};
