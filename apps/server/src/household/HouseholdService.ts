import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import type { HouseholdRequest } from '@ValenceContracts/schemas/Household';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { StoredHousehold } from './StoredHousehold';

type HouseholdService = {
  read: (userId: string) => Promise<StoredHousehold>;
  isOnboarded: (userId: string) => Promise<boolean>;
  change: (userId: string, request: HouseholdRequest) => Promise<boolean>;
  finishOnboarding: (userId: string) => Promise<boolean>;
  wayInOf: (userId: string) => Promise<string | null>;
  accountOfWayIn: (wayInId: string) => Promise<string | null>;
  readAvatar: (
    userId: string,
    isFramed?: boolean,
  ) => Promise<{ body: Uint8Array; contentType: string } | null>;
  savePhoto: (
    userId: string,
    photo: { body: Uint8Array; contentType: string },
    frame?: PhotoFrame | null,
  ) => Promise<PictureFault | null>;
};

export type { HouseholdService };
