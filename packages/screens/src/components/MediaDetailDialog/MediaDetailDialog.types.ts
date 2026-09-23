import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { CastMember } from './components/CastGrid/CastGrid.types';

type MediaDetailDialogProps = {
  media: MediaSummary | null;
  onClose: () => void;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  resumeSeconds?: number;
  watchedFractionFor?: (mediaId: string) => number | undefined;
  siblings?: MediaSummary[];
  onSelectSibling?: (media: MediaSummary) => void;
  onBack?: () => void;
  backLabel?: string;
  isKept?: boolean;
  onToggleKept?: (media: MediaSummary) => void;
  onRate?: (media: MediaSummary, stars: number | null) => void;
  onOpenPerson?: (member: CastMember) => void;
  onShare?: (media: MediaSummary) => void;
  onHide?: (media: MediaSummary) => void;
  onDecideForSomebody?: (media: MediaSummary) => void;
  onStartParty?: (media: MediaSummary) => void;
  onPlayOn?: (media: MediaSummary, startSeconds: number) => void;
};

export type { MediaDetailDialogProps };
