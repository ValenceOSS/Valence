import type { AVATAR_STYLES, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type ADrawnStudioProps = {
  style: (typeof AVATAR_STYLES)[number];
  seed: string;
  colour: ProfileColour;
  onChange: (next: { style: (typeof AVATAR_STYLES)[number]; seed: string }) => void;
  onColour: (colour: ProfileColour) => void;
};

export type { ADrawnStudioProps };
