import type { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';

const READING_THEMES: Readonly<
  Record<
    (typeof READING_THEME_IDS)[number],
    { paper: string; ink: string; isBold: boolean; isDark: boolean }
  >
> = {
  original: { paper: '#ffffff', ink: '#121212', isBold: false, isDark: false },
  quiet: { paper: '#d6c8a0', ink: '#2e2818', isBold: false, isDark: false },
  paper: { paper: '#f1f1f4', ink: '#1c1c1e', isBold: false, isDark: false },
  bold: { paper: '#000000', ink: '#ffffff', isBold: true, isDark: true },
  calm: { paper: '#3e3a2b', ink: '#ece3c7', isBold: false, isDark: true },
  focus: { paper: '#161618', ink: '#e4e4e8', isBold: false, isDark: true },
};

export { READING_THEMES };
