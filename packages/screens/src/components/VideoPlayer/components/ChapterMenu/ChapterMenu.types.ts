import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type ChapterMenuProps = {
  chapters: readonly VideoChapter[];
  position: number;
  onSeek: (seconds: number) => void;
  onOpenChange?: (isOpen: boolean) => void;
  isDisabled?: boolean;
};

export type { ChapterMenuProps };
