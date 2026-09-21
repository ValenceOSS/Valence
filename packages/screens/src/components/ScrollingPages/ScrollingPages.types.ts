type ScrollingPagesProps = {
  bookId: string;
  chapterId: string;
  pageCount: number;
  startAtPage: number;
  hasNextChapter: boolean;
  onPageChange: (page: number) => void;
  onNextChapter: () => void;
  onTap: () => void;
};

export type { ScrollingPagesProps };
