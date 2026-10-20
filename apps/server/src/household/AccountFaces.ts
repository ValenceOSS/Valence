import type { Household, HouseholdRequest } from '@ValenceContracts/schemas/Household';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

type AccountFaces = {
  read: (accountId: string, accountName: string) => Promise<Household>;
  readPicture: (accountId: string) => Promise<{ body: Uint8Array; contentType: string } | null>;
  change: (accountId: string, request: HouseholdRequest) => Promise<'changed' | 'tooLong' | 'gone'>;
  savePhoto: (
    accountId: string,
    photo: { body: Uint8Array; contentType: string },
  ) => Promise<PictureFault | null>;
  forgetOwn: (accountId: string) => Promise<void>;
};

export type { AccountFaces };
