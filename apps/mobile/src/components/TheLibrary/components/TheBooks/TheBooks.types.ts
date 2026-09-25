import type { ReactNode } from 'react';

type TheBooksProps = {
  header: ReactNode;
  libraryIds: readonly string[];
  onBook: (bookId: string) => void;
  onRead: (bookId: string) => void;
  onListen: (bookId: string) => void;
  onScrolled?: (isScrolled: boolean) => void;
  onScrolledTo?: (y: number) => void;
};

export type { TheBooksProps };
