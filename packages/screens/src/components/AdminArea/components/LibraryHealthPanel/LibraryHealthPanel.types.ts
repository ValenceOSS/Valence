import type { HealthItem } from '@ValenceContracts/schemas/LibraryHealth';

type LibraryHealthPanelProps = {
  onCorrect: (item: HealthItem) => void;
  onChooseArtwork: (item: HealthItem) => void;
  onOpenFolder: (path: string) => void;
};

export type { LibraryHealthPanelProps };
