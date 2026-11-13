import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type FaceSizesProps = {
  name: string;
  colour: ProfileColour;
  avatar: Avatar;
  source: string;
  pending: File | null;
};

export type { FaceSizesProps };
