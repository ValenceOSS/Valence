import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type FaceCircleProps = {
  name: string;
  colour: ProfileColour;
  avatar: Avatar;
  source: string;
  pending?: File | null;
  shape?: 'circle' | 'tile';
  isLifted?: boolean;
  className?: string;
};

export type { FaceCircleProps };
