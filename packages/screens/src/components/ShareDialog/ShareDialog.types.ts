import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type ShareSubject =
  | { kind: 'item'; media: MediaSummary }
  | { kind: 'series'; seriesId: string; title: string }
  | { kind: 'book'; book: Book };

type ShareDialogProps = {
  subject: ShareSubject | null;
  isOpen: boolean;
  onClose: () => void;
  origin?: string;
};

export type { ShareDialogProps, ShareSubject };
