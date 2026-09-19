import type { Reencode } from '@ValenceContracts/schemas/Reencode';

type ReencodeReviewProps = {
  reencode: Reencode | null;
  onConfirm: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  onWatch?: (reencode: Reencode) => void;
  onClose: () => void;
};

export type { ReencodeReviewProps };
