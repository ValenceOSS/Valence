type ABookProps = {
  bookId: string;
  onRead: (bookId: string, chapterId: string | null, isFromTheStart: boolean) => void;
  onBack: () => void;
};

export type { ABookProps };
