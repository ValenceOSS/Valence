import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type ShareableMedia = Pick<MediaSummary, 'id' | 'title' | 'seriesId'> &
  Partial<Pick<MediaSummary, 'seriesTitle' | 'hasPoster' | 'hasBackdrop' | 'hasLogo'>>;

type ShareSubject =
  | { kind: 'item'; media: ShareableMedia }
  | { kind: 'series'; seriesId: string; title: string }
  | { kind: 'book'; book: Book };

type ShareChoice = {
  lasts: string;
  cap: string;
  isWholeProgramme: boolean;
};

export type { ShareChoice, ShareSubject, ShareableMedia };
