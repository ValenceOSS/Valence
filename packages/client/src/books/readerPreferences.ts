import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { ReadingDirection } from '@ValenceContracts/schemas/Book';

const STORAGE_KEY = 'valence.reader';

const FITS = ['width', 'height', 'both'] as const;

const MOST_GAP = 64;

const FitSchema = z.enum(FITS);

const PreferencesSchema = z.object({
  isDouble: z.boolean(),
  isOffset: z.boolean(),
  fit: FitSchema,
  direction: z.enum(['rightToLeft', 'leftToRight']),
  isScrolling: z.boolean().default(false),
  isAnimated: z.boolean().default(true),
  gap: z.number().int().min(0).max(MOST_GAP).default(0),
});

type ReaderFit = z.infer<typeof FitSchema>;

type ReaderPreferences = z.infer<typeof PreferencesSchema>;

/**
 * How somebody likes to read, as they last left it.
 *
 * Kept on the device rather than against the account, because it is a property of the screen: the
 * same person wants two pages on a desktop and one on a phone, and a setting that followed them
 * between the two would be wrong in one of them every time.
 *
 * Reading straight down a long strip, as a webtoon is read, is a way of reading like any other and
 * is remembered the same way, off unless somebody has turned it on.
 *
 * Whether turning a page is animated, and how much room to leave between the two pages of a
 * spread, are remembered the same way: animated, and none, until somebody says otherwise.
 *
 * Each book keeps its own, so a manga read right to left in two pages does not change how the next
 * novel opens. A book opened for the first time starts from however the last one was left, but in
 * its own direction — manga right to left, everything else the other way — since that is a fact
 * about the book rather than a taste; whatever somebody chooses after that is theirs.
 *
 * @param direction - Which way this book is read, where nobody has said otherwise.
 * @param bookId - The book being read, where there is one.
 * @returns How to read, saved or defaulted.
 */
const readReaderPreferences = (direction: ReadingDirection, bookId?: string): ReaderPreferences => {
  const store = platformInUse().store;
  const own = bookId === undefined ? null : store.read(`${STORAGE_KEY}.${bookId}`);
  const held = own ?? store.read(STORAGE_KEY);
  const read = PreferencesSchema.safeParse(held === null ? null : JSON.parse(held));

  if (!read.success) {
    return {
      isDouble: false,
      isOffset: true,
      fit: 'both',
      direction,
      isScrolling: false,
      isAnimated: true,
      gap: 0,
    };
  }

  return bookId !== undefined && own === null ? { ...read.data, direction } : read.data;
};

/**
 * Remembers how somebody likes to read, for this book and as where the next new one starts.
 *
 * @param preferences - How they left it.
 * @param bookId - The book being read, where there is one.
 */
const writeReaderPreferences = (preferences: ReaderPreferences, bookId?: string): void => {
  const store = platformInUse().store;

  store.write(STORAGE_KEY, JSON.stringify(preferences));

  if (bookId !== undefined) {
    store.write(`${STORAGE_KEY}.${bookId}`, JSON.stringify(preferences));
  }
};

export type { ReaderFit, ReaderPreferences };

export { MOST_GAP, readReaderPreferences, writeReaderPreferences };
