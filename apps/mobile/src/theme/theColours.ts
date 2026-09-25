type Colours = {
  accent: string;
  accentContrast: string;
  border: string;
  danger: string;
  highlight: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
};

const theColours: Record<'light' | 'dark', Colours> = {
  light: {
    accent: '#303c51',
    accentContrast: '#f6fbf9',
    border: '#c9d8d8',
    danger: '#c13c3b',
    highlight: '#8d6800',
    surface: '#f6fbf9',
    surfaceRaised: '#e9f3ef',
    text: '#303c51',
    textMuted: '#546271',
  },
  dark: {
    accent: '#e9f3ef',
    accentContrast: '#0e0e0e',
    border: '#2e2e2e',
    danger: '#ea6a64',
    highlight: '#f5d589',
    surface: '#0e0e0e',
    surfaceRaised: '#141414',
    text: '#e9f3ef',
    textMuted: '#a4a4a4',
  },
};

export type { Colours };

export { theColours };
