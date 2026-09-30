import type { ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';

type ArtworkTileProps = {
  kind: ArtworkKind;
  label: string;
  previewUrl: string | null;
  note: string;
  isChosen: boolean;
  isBusy: boolean;
  onChoose: () => void;
};

export type { ArtworkTileProps };
