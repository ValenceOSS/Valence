import type { Avatar, PhotoFrame, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type FacePreviewsProps = {
  name: string;
  colour: ProfileColour;
  avatar: Avatar;
  source: string;
  pending: File | null;
  onFrame?: (frame: PhotoFrame) => void;
  className?: string;
};

export type { FacePreviewsProps };
