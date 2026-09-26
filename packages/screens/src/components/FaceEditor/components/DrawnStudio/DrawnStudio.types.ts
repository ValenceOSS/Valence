import type { AVATAR_STYLES } from '@ValenceContracts/schemas/ViewerProfile';

type DrawnStyle = (typeof AVATAR_STYLES)[number];

type DrawnStudioProps = {
  style: DrawnStyle;
  seed: string;
  onChange: (next: { style: DrawnStyle; seed: string }) => void;
};

export type { DrawnStudioProps, DrawnStyle };
