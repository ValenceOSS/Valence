import type { CueColumn } from '@ValenceClient/playback/cornerOf';

type ItLinesUp = {
  alignSelf: 'flex-start' | 'center' | 'flex-end';
  textAlign: 'left' | 'center' | 'right';
};

const LINED_UP: Record<CueColumn, ItLinesUp> = {
  left: { alignSelf: 'flex-start', textAlign: 'left' },
  centre: { alignSelf: 'center', textAlign: 'center' },
  right: { alignSelf: 'flex-end', textAlign: 'right' },
};

/**
 * How a line lines up with the lines around it and its words with each other, by the third of the
 * picture its alignment names across.
 *
 * @param across - The column the line's alignment names.
 * @returns Which side of the room it keeps to, and which side its words keep to.
 */
const howItLinesUp = (across: CueColumn): ItLinesUp => LINED_UP[across];

export type { ItLinesUp };

export { howItLinesUp };
