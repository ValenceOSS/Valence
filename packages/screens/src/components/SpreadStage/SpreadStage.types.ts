import type { ReaderFit } from '@ValenceClient/books/readerPreferences';

type SpreadStageProps = {
  spreads: readonly (readonly number[])[];
  spreadAt: number;
  bookId: string;
  chapterId: string;
  across: number;
  fit: ReaderFit;
  gap: number;
  isRightToLeft: boolean;
  isAnimated: boolean;
  isHeld?: boolean;
  canGoBack?: boolean;
  canGoOn?: boolean;
  onTurn?: (by: 1 | -1) => void;
  onLoaded: (page: number, element: HTMLImageElement) => void;
};

export type { SpreadStageProps };
