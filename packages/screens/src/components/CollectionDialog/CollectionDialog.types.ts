import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type CollectionDialogProps = {
  collectionId: string | null;
  onClose: () => void;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onInspect: (media: MediaSummary) => void;
  onOpenShow: (media: MediaSummary) => void;
};

export type { CollectionDialogProps };
