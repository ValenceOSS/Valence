import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.reader.text';

const TEXT_SIZES = ['small', 'medium', 'large', 'larger'] as const;

const TEXT_SPACINGS = ['tight', 'normal', 'loose'] as const;

const TEXT_MARGINS = ['narrow', 'normal', 'wide'] as const;

const TEXT_PAGES = ['light', 'sepia', 'dark'] as const;

const TextPreferencesSchema = z.object({
  size: z.enum(TEXT_SIZES).catch('medium'),
  spacing: z.enum(TEXT_SPACINGS).catch('normal'),
  margins: z.enum(TEXT_MARGINS).catch('normal'),
  page: z.enum(TEXT_PAGES).catch('dark'),
});

type TextPreferences = z.infer<typeof TextPreferencesSchema>;

const DEFAULTS: TextPreferences = {
  size: 'medium',
  spacing: 'normal',
  margins: 'normal',
  page: 'dark',
};

/**
 * How somebody likes text set, as they last left it: how large, how far apart the lines, how wide
 * the margins, and whether the page is light, sepia or dark.
 *
 * Kept on the device beside the page reader's own settings, under a key of its own so that neither
 * can spoil the other, and for the same reason as those: it is a property of the screen. Anything
 * unreadable in what was kept falls back to the default for that one setting rather than all four.
 *
 * Each book keeps its own, so the one read on a phone at night in large sepia type does not change
 * the next; a book opened for the first time starts from however the last one was left.
 *
 * @param bookId - The book being read, where there is one.
 * @returns How to set text, saved or defaulted.
 */
const readTextPreferences = (bookId?: string): TextPreferences => {
  const store = platformInUse().store;
  const held =
    (bookId === undefined ? null : store.read(`${STORAGE_KEY}.${bookId}`)) ??
    store.read(STORAGE_KEY);

  try {
    const read = TextPreferencesSchema.safeParse(held === null ? {} : JSON.parse(held));

    return read.success ? read.data : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

/**
 * Remembers how somebody likes text set, for this book and as where the next new one starts.
 *
 * @param preferences - How they left it.
 * @param bookId - The book being read, where there is one.
 */
const writeTextPreferences = (preferences: TextPreferences, bookId?: string): void => {
  const store = platformInUse().store;

  store.write(STORAGE_KEY, JSON.stringify(preferences));

  if (bookId !== undefined) {
    store.write(`${STORAGE_KEY}.${bookId}`, JSON.stringify(preferences));
  }
};

export type { TextPreferences };

export {
  TEXT_MARGINS,
  TEXT_PAGES,
  TEXT_SIZES,
  TEXT_SPACINGS,
  readTextPreferences,
  writeTextPreferences,
};
