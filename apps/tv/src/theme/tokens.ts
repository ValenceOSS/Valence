import { ROUNDNESS_SCALES } from '@ValenceContracts/schemas/Roundness';
import { palette } from '@ValenceTv/theme/palette';

const ACROSS_THE_ROOM = 2;

const CORNER = ROUNDNESS_SCALES.default * ACROSS_THE_ROOM;

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
  accent: palette.text,
  accentHover: palette.text,
  onAccent: palette.surface,
  onWhite: '#000000',
  danger: palette.danger,
  onDanger: palette.onDanger,
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
  xs: Math.round(4 * CORNER),
  sm: Math.round(5 * CORNER),
  md: Math.round(6 * CORNER),
  lg: Math.round(8 * CORNER),
  xl: Math.round(10 * CORNER),
  xxl: Math.round(12 * CORNER),
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

const ACTION_WIDTH = 640;

const FOCUS_RING = 3 * ACROSS_THE_ROOM;

const tokens = {
  colours,
  space,
  radii,
  type,
  FOCUS_SCALE,
  ACTION_WIDTH,
  FOCUS_RING,
  ACROSS_THE_ROOM,
};

export { tokens };
