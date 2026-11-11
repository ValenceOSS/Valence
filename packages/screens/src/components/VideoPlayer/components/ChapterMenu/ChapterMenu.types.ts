import type { ReactNode } from 'react';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type ChapterMenuProps = {
  chapters: readonly VideoChapter[];
  position: number;
  onSeek: (seconds: number) => void;
  onOpenChange?: (isOpen: boolean) => void;
  isDisabled?: boolean;
  renderFrame?: (seconds: number) => ReactNode;
};

export type { ChapterMenuProps };
