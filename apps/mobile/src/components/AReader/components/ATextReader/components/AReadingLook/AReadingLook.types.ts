import type { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';

type AReadingLookProps = {
  theme: (typeof READING_THEME_IDS)[number];
  onTheme: (theme: (typeof READING_THEME_IDS)[number]) => void;
  onSmaller: (() => void) | null;
  onLarger: (() => void) | null;
};

export type { AReadingLookProps };
