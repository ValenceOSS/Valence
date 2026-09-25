type AReaderProps = {
  bookId: string;
  chapterId: string | null;
  isFromTheStart: boolean;
  onBack: () => void;
};

export type { AReaderProps };
