import { z } from 'zod';

const BOOK_LAYOUTS = ['fixed', 'reflow', 'audio'] as const;

const TEXT_BOOK_FORMATS = ['cbz', 'cbr', 'pdf', 'epub'] as const;

const AUDIOBOOK_FORMATS = ['m4b', 'm4a', 'mp3', 'aac', 'ogg', 'opus', 'flac'] as const;

const BOOK_FORMATS = [...TEXT_BOOK_FORMATS, ...AUDIOBOOK_FORMATS] as const;

const READING_DIRECTIONS = ['rightToLeft', 'leftToRight'] as const;

const BOOK_DOCUMENT_TAGS = [
  'p',
  'div',
  'span',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'em',
  'i',
  'strong',
  'b',
  'u',
  's',
  'small',
  'sub',
  'sup',
  'mark',
  'blockquote',
  'q',
  'cite',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'img',
  'figure',
  'figcaption',
  'a',
  'ruby',
  'rt',
  'rp',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'abbr',
  'time',
] as const;

const BookLayoutSchema = z.enum(BOOK_LAYOUTS);

const BookFormatSchema = z.enum(BOOK_FORMATS);

const ReadingDirectionSchema = z.enum(READING_DIRECTIONS);

const ChapterMarkSchema = z.object({
  title: z.string(),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative(),
});

const BookChapterSchema = z.object({
  id: z.string().uuid(),
  bookId: z.string().uuid(),
  number: z.number(),
  title: z.string(),
  format: BookFormatSchema,
  pageCount: z.number().int().positive().nullable(),
  durationSeconds: z.number().nonnegative().nullable().optional(),
  marks: z.array(ChapterMarkSchema).optional(),
  addedAt: z.string(),
});

const BookSchema = z.object({
  id: z.string().uuid(),
  libraryId: z.string().uuid(),
  title: z.string().min(1),
  layout: BookLayoutSchema,
  direction: ReadingDirectionSchema,
  year: z.number().int().min(1400).max(2200).nullable(),
  overview: z.string().nullable(),
  genres: z.array(z.string()).nullable(),
  authors: z.array(z.string()).nullable(),
  rating: z.number().nullable(),
  posterUrl: z.string().url().nullish(),
  hasCover: z.boolean().default(false),
  chapterCount: z.number().int().nonnegative(),
  hasText: z.boolean().optional(),
  hasAudio: z.boolean().optional(),
  addedAt: z.string(),
  updatedAt: z.string(),
});

const BookDetailSchema = z.object({
  book: BookSchema,
  chapters: z.array(BookChapterSchema),
});

const BookContentsSchema = z.object({
  parts: z.array(z.object({ size: z.number().int().nonnegative() })),
  contents: z.array(
    z.object({
      title: z.string(),
      part: z.number().int().nonnegative(),
      anchor: z.string().nullable(),
      depth: z.number().int().nonnegative(),
    }),
  ),
});

const ReadingProgressSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  pageNumber: z.number().int().nonnegative().nullable(),
  fraction: z.number().min(0).max(1).nullable(),
  isFinished: z.boolean(),
  updatedAt: z.string(),
});

const BookReadingSchema = z.object({
  book: BookSchema,
  chapterId: z.string().uuid(),
  chapterTitle: z.string(),
  pageNumber: z.number().int().nonnegative().nullable(),
  pageCount: z.number().int().positive().nullable(),
  fraction: z.number().min(0).max(1).nullable(),
  isFinished: z.boolean(),
  updatedAt: z.string(),
});

const BookReadingListSchema = z.object({ readings: z.array(BookReadingSchema) });

const SaveReadingProgressSchema = z.object({
  pageNumber: z.number().int().nonnegative().nullable(),
  fraction: z.number().min(0).max(1).nullable(),
  isFinished: z.boolean().default(false),
});

/**
 * Which way a book is read where nobody has said, decided by what it is.
 *
 * Manga is read right to left, and a comic or a novel left to right. Neither is knowable from the
 * file, so the layout stands in for it: a fixed-page book in a Valence library is overwhelmingly manga,
 * and anybody it is wrong for can say so once and be remembered.
 *
 * @param layout - Whether the book paginates ahead of time or reflows.
 * @returns The direction to read it in until somebody says otherwise.
 */
const directionFor = (
  layout: z.infer<typeof BookLayoutSchema>,
): z.infer<typeof ReadingDirectionSchema> => (layout === 'fixed' ? 'rightToLeft' : 'leftToRight');

const AUDIOBOOK_FORMAT_SET: ReadonlySet<string> = new Set(AUDIOBOOK_FORMATS);

/**
 * Whether a book's file is listened to rather than read.
 *
 * @param format - The file's format.
 * @returns Whether it is an audiobook's.
 */
const isAudiobookFormat = (format: z.infer<typeof BookFormatSchema>): boolean =>
  AUDIOBOOK_FORMAT_SET.has(format);

export type BookLayout = z.infer<typeof BookLayoutSchema>;
export type BookFormat = z.infer<typeof BookFormatSchema>;
export type ReadingDirection = z.infer<typeof ReadingDirectionSchema>;
export type Book = z.infer<typeof BookSchema>;
export type BookChapter = z.infer<typeof BookChapterSchema>;
export type ChapterMark = z.infer<typeof ChapterMarkSchema>;
export type BookDetail = z.infer<typeof BookDetailSchema>;
export type BookContents = z.infer<typeof BookContentsSchema>;
export type ReadingProgress = z.infer<typeof ReadingProgressSchema>;
export type BookReading = z.infer<typeof BookReadingSchema>;
export type SaveReadingProgress = z.infer<typeof SaveReadingProgressSchema>;

const PLACE_LINK = /^#valence-part-(\d+)(?::(.+))?$/;

/**
 * Writes a place in a book as a link inside one of its parts, so that following it moves the reader
 * rather than the browser.
 *
 * @param part - Which part of the book.
 * @param anchor - Where in it, if anywhere.
 * @returns The link.
 */
const linkToBookPlace = (part: number, anchor: string | null): string =>
  `#valence-part-${part.toString()}${anchor === null ? '' : `:${anchor}`}`;

/**
 * Reads the place a link inside a book points at, where it points at one.
 *
 * @param href - The link.
 * @returns The part and where in it, or nothing where the link leads out of the book.
 */
const bookPlaceIn = (href: string): { part: number; anchor: string | null } | null => {
  const found = PLACE_LINK.exec(href);

  return found === null ? null : { part: Number(found[1]), anchor: found[2] ?? null };
};

export {
  AUDIOBOOK_FORMATS,
  BOOK_DOCUMENT_TAGS,
  BOOK_FORMATS,
  TEXT_BOOK_FORMATS,
  ChapterMarkSchema,
  isAudiobookFormat,
  BOOK_LAYOUTS,
  READING_DIRECTIONS,
  BookChapterSchema,
  BookContentsSchema,
  BookDetailSchema,
  BookFormatSchema,
  BookLayoutSchema,
  BookReadingListSchema,
  BookReadingSchema,
  BookSchema,
  ReadingDirectionSchema,
  ReadingProgressSchema,
  SaveReadingProgressSchema,
  bookPlaceIn,
  directionFor,
  linkToBookPlace,
};
