import type { ReaderFit } from '@ValenceClient/books/readerPreferences';

type AReaderSideProps = {
  breadth: number;
  side: 'left' | 'right';
  top: number;
  below: number;
  ink: string;
  isRightToLeft: boolean;
  isMarked: boolean;
  isLocked: boolean;
  fit: ReaderFit;
  place: string;
  through: number;
  next: { title: string; cover: string } | null;
  onForward: () => void;
  onMark: () => void;
  onLock: () => void;
  onFit: () => void;
  onReadOn: () => void;
};

export type { AReaderSideProps };
