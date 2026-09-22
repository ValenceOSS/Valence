import { palette } from '@ValenceTv/theme/palette';

const ACROSS_THE_ROOM = 2;

const colours = {
  canvas: palette.surface,
  raised: palette.surfaceRaised,
  border: palette.border,
  line: palette.line,
  hover: palette.hover,
  active: palette.active,
  text: palette.text,
  muted: palette.textMuted,
  faint: palette.line,
  accent: palette.accent,
  accentHover: palette.accentHover,
  onAccent: palette.accentContrast,
  onWhite: palette.onWhite,
  danger: palette.danger,
  success: palette.success,
  scrim: palette.scrim,
  onScrim: palette.onScrim,
} as const;

const space = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
  edge: 90,
} as const;

const radii = {
  xs: 4 * ACROSS_THE_ROOM,
  sm: 5 * ACROSS_THE_ROOM,
  md: 6 * ACROSS_THE_ROOM,
  lg: 8 * ACROSS_THE_ROOM,
  xl: 10 * ACROSS_THE_ROOM,
  xxl: 12 * ACROSS_THE_ROOM,
  round: 999,
} as const;

const type = {
  hero: 76,
  title: 52,
  heading: 36,
  body: 28,
  small: 22,
} as const;

const FOCUS_SCALE = 1.08;

const FOCUS_RING = 3 * ACROSS_THE_ROOM;

const tokens = { colours, space, radii, type, FOCUS_SCALE, FOCUS_RING, ACROSS_THE_ROOM };

export { tokens };
