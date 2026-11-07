import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type PersonDialogProps = {
  personId: number | null;
  role?: string | null;
  onClose: () => void;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onInspect: (media: MediaSummary) => void;
  onOpenShow?: (media: MediaSummary) => void;
  onAsk?: (asking: string) => void;
  onBack?: () => void;
  backLabel?: string;
};

export type { PersonDialogProps };
