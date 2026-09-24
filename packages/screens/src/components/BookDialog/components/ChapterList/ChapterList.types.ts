import type { BookChapter } from '@ValenceContracts/schemas/Book';

type ChapterListProps = {
  chapters: readonly BookChapter[];
  read: ReadonlyMap<string, number>;
  onOpen: (chapterId: string) => void;
};

export type { ChapterListProps };
