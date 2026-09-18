import type { Household, HouseholdRequest } from '@ValenceContracts/schemas/Household';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

type HouseholdService = {
  read: (userId: string, fallbackName: string) => Promise<Household>;
  isOnboarded: (userId: string) => Promise<boolean>;
  change: (userId: string, request: HouseholdRequest) => Promise<boolean>;
  finishOnboarding: (userId: string) => Promise<boolean>;
  readAvatar: (userId: string) => Promise<{ body: Uint8Array; contentType: string } | null>;
  savePhoto: (
    userId: string,
    photo: { body: Uint8Array; contentType: string },
  ) => Promise<PictureFault | null>;
};

export type { HouseholdService };
