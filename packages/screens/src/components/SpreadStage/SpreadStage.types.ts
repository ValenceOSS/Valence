import type { ReaderFit } from '@ValenceScreens/reading/readerPreferences';

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
  onLoaded: (page: number, element: HTMLImageElement) => void;
};

export type { SpreadStageProps };
