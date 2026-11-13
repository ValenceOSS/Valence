import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type APersonProps = {
  personId: number;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onAsk?: (kind: MediaRequestKind, id: string) => void;
  onBack: () => void;
};

export type { APersonProps };
