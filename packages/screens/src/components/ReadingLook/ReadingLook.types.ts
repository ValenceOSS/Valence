import type { ReactNode } from 'react';
import type { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';

type ReadingLookProps = {
  theme: (typeof READING_THEME_IDS)[number];
  onTheme: (theme: (typeof READING_THEME_IDS)[number]) => void;
  onSmaller: (() => void) | null;
  onLarger: (() => void) | null;
  onOpenChange?: (isOpen: boolean) => void;
  children?: ReactNode;
};

export type { ReadingLookProps };
