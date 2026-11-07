import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { MOST_GAP } from '@ValenceClient/books/readerPreferences';
import { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';

const STORAGE_KEY = 'valence.reader.text';

const TEXT_SIZES = ['small', 'medium', 'large', 'larger'] as const;

const TEXT_SPACINGS = ['tight', 'normal', 'loose'] as const;

const TEXT_MARGINS = ['narrow', 'normal', 'wide'] as const;

const TEXT_PAGES = ['light', 'sepia', 'dark'] as const;

const TextPreferencesSchema = z.object({
  size: z.enum(TEXT_SIZES).catch('medium'),
  spacing: z.enum(TEXT_SPACINGS).catch('normal'),
  margins: z.enum(TEXT_MARGINS).catch('normal'),
  page: z.enum(TEXT_PAGES).catch('light'),
  isDouble: z.boolean().catch(true),
  gap: z.number().int().min(0).max(MOST_GAP).catch(24),
  isAnimated: z.boolean().catch(true),
  isScrolling: z.boolean().catch(false),
  theme: z.enum(READING_THEME_IDS).optional().catch(undefined),
});

type TextPreferences = z.infer<typeof TextPreferencesSchema>;

const DEFAULTS: TextPreferences = {
  size: 'medium',
  spacing: 'normal',
  margins: 'normal',
  page: 'light',
  isDouble: true,
  gap: 24,
  isAnimated: true,
  isScrolling: false,
};

/**
 * How somebody likes text set, as they last left it: how large, how far apart the lines, how wide
 * the margins, the theme, and how pages turn.
 *
 * One set for the whole device, the same in every book, as Apple Books keeps it: kept beside the
 * page reader's own settings, under a key of its own so that neither can spoil the other, and for
 * the same reason as those: it is a property of the screen. Anything unreadable in what was kept
 * falls back to the default for that one setting rather than all of them.
 *
 * @returns How to set text, saved or defaulted.
 */
const readTextPreferences = (): TextPreferences => {
  const held = platformInUse().store.read(STORAGE_KEY);

  try {
    const read = TextPreferencesSchema.safeParse(held === null ? {} : JSON.parse(held));

    return read.success ? read.data : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

/**
 * Remembers how somebody likes text set, for every book on this device.
 *
 * @param preferences - How they left it.
 */
const writeTextPreferences = (preferences: TextPreferences): void => {
  platformInUse().store.write(STORAGE_KEY, JSON.stringify(preferences));
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
