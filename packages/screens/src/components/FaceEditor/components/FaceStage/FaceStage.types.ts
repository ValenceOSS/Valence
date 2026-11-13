import type { Avatar, PhotoFrame, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

type FaceStageProps = {
  name: string;
  colour: ProfileColour;
  avatar: Avatar;
  source: string;
  pending: File | null;
  framing: {
    picture: string;
    frame: PhotoFrame;
    tone: PictureTone;
    onFrame: (frame: PhotoFrame) => void;
  } | null;
};

export type { FaceStageProps };
