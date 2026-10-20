import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type StoredHousehold = {
  name: string | null;
  colour: ProfileColour | null;
  avatar: Avatar | null;
  updatedAt: string;
};

export type { StoredHousehold };
