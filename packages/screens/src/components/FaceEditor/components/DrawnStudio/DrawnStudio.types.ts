import type { AVATAR_STYLES } from '@ValenceContracts/schemas/ViewerProfile';

type DrawnStyle = (typeof AVATAR_STYLES)[number];

type DrawnStudioProps = {
  style: DrawnStyle;
  seed: string;
  colour: string;
  isOnColour: boolean;
  onChange: (next: { style: DrawnStyle; seed: string }) => void;
  onColour: (colour: string) => void;
  onClear: () => void;
};

export type { DrawnStudioProps, DrawnStyle };
