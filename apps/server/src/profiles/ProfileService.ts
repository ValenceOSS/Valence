import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { PictureFault } from './whatIsWrongWithThePicture';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';

type ProfileRequest = {
  name: string;
  colour: ProfileColour;
  avatar?: Avatar;
  askStillWatchingAfter?: number;
  showsWhatIamWatching?: boolean;
  discordPresence?: DiscordPresence;
  prefersBestCopy?: boolean;
};

type ProfileStanding = {
  id: string;
  userId: string;
  name: string;
  isOwner: boolean;
  mayRequest: boolean;
  pinHash: string | null;
  pinFailures: number;
  pinLockedUntil: Date | null;
};

type PinTry =
  | { kind: 'locked'; until: Date }
  | { kind: 'counted'; failures: number; lockedUntil: Date | null };

type ProfileService = {
  list: (userId: string) => Promise<ViewerProfile[]>;
  ensureDefault: (userId: string, name: string) => Promise<ViewerProfile>;
  create: (userId: string, request: ProfileRequest) => Promise<ViewerProfile>;
  rename: (userId: string, profileId: string, request: ProfileRequest) => Promise<boolean>;
  remove: (userId: string, profileId: string) => Promise<boolean>;
  belongsTo: (userId: string, profileId: string) => Promise<boolean>;
  moveTo: (profileId: string, newOwnerId: string) => Promise<boolean>;
  readAvatar: (profileId: string) => Promise<{ body: Uint8Array; contentType: string } | null>;
  listEveryone: () => Promise<ViewerProfile[]>;
  findSignIn: (profileId: string) => Promise<{ email: string; username: string | null } | null>;
  accountOf: (profileId: string) => Promise<string | null>;
  standingOf: (profileId: string) => Promise<ProfileStanding | null>;
  setPin: (profileId: string, pinHash: string | null) => Promise<void>;
  setPinTries: (profileId: string, failures: number, lockedUntil: Date | null) => Promise<void>;
  claimAPinTry: (
    profileId: string,
    at: Date,
    lockFor: (failures: number) => Date | null,
  ) => Promise<PinTry | null>;
  setMayRequest: (profileId: string, mayRequest: boolean) => Promise<void>;
  handOver: (userId: string, profileId: string) => Promise<boolean>;
  savePhoto: (
    userId: string,
    profileId: string,
    photo: { body: Uint8Array; contentType: string },
  ) => Promise<PictureFault | null>;
};

export type { PinTry, ProfileRequest, ProfileService, ProfileStanding };
