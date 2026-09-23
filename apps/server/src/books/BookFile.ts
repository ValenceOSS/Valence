import type { ChapterMark } from '@ValenceContracts/schemas/Book';

type BookPageBytes = {
  bytes: Uint8Array;
  contentType: string;
};

type SpineEntry = {
  href: string;
  title: string;
  size: number;
};

type ContentsPlace = {
  title: string;
  part: number;
  anchor: string | null;
  depth: number;
};

type BookAbout = {
  series: string | null;
  title: string | null;
  authors: string[];
  description: string | null;
};

type FixedBook = {
  layout: 'fixed';
  pageCount: number;
  about?: BookAbout;
  readPage: (at: number) => Promise<BookPageBytes | null>;
};

type ReflowBook = {
  layout: 'reflow';
  spine: SpineEntry[];
  about?: BookAbout;
  readContents: () => Promise<ContentsPlace[]>;
  readDocument: (part: number) => Promise<string | null>;
  readResource: (href: string) => Promise<BookPageBytes | null>;
  readCover: () => Promise<BookPageBytes | null>;
};

type ListenBook = {
  layout: 'audio';
  durationSeconds: number;
  marks: ChapterMark[];
  track: number | null;
  about?: BookAbout;
  readCover: () => Promise<BookPageBytes | null>;
};

type OpenedBook = FixedBook | ReflowBook | ListenBook;

export type {
  BookAbout,
  BookPageBytes,
  ContentsPlace,
  FixedBook,
  ListenBook,
  OpenedBook,
  ReflowBook,
  SpineEntry,
};
