import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type FaceCircleProps = {
  name: string;
  colour: ProfileColour;
  avatar: Avatar;
  source: string;
  pending?: File | null;
  className?: string;
};

export type { FaceCircleProps };
