import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ReencodeEstimate, ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

type ReencodeDialogProps = {
  isOpen: boolean;
  media: MediaSummary[];
  estimate: ReencodeEstimate | null;
  isWeighing?: boolean;
  onWeigh: (mediaIds: string[], settings: ReencodeSettings) => void;
  onStart: (mediaIds: string[], settings: ReencodeSettings) => Promise<boolean>;
  onClose: () => void;
};

export type { ReencodeDialogProps };
