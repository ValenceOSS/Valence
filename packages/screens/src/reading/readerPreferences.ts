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
 * The book's own direction is the starting point where nothing has been saved — manga right to left,
 * everything else the other way — and whatever somebody chooses after that is theirs.
 *
 * @param direction - Which way this book is read, where nobody has said otherwise.
 * @returns How to read, saved or defaulted.
 */
const readReaderPreferences = (direction: ReadingDirection): ReaderPreferences => {
  const held = platformInUse().store.read(STORAGE_KEY);
  const read = PreferencesSchema.safeParse(held === null ? null : JSON.parse(held));

  return read.success
    ? read.data
    : {
        isDouble: false,
        isOffset: true,
        fit: 'both',
        direction,
        isScrolling: false,
        isAnimated: true,
        gap: 0,
      };
};

/**
 * Remembers how somebody likes to read.
 *
 * @param preferences - How they left it.
 */
const writeReaderPreferences = (preferences: ReaderPreferences): void => {
  platformInUse().store.write(STORAGE_KEY, JSON.stringify(preferences));
};

export type { ReaderFit, ReaderPreferences };

export { MOST_GAP, readReaderPreferences, writeReaderPreferences };
