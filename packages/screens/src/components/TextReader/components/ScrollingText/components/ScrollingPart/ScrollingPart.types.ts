type ScrollingPartProps = {
  bookId: string;
  chapterId: string;
  part: number;
  onFollow: (place: { part: number; anchor: string | null }) => void;
};

export type { ScrollingPartProps };
