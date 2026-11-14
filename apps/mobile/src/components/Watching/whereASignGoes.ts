import { cornerOf } from '@ValenceClient/playback/cornerOf';
import { howItLinesUp } from '@ValenceClient/playback/howItLinesUp';
import type { CueColumn, CueCorner } from '@ValenceClient/playback/cornerOf';
import type { ABox } from '@ValenceMobile/components/Watching/howBigToDrawIt';
import type { AFrame } from '@ValenceMobile/components/Watching/fittedTo';
import type { ItLinesUp } from '@ValenceClient/playback/howItLinesUp';

type ASignsPlace = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  alignItems: ItLinesUp['alignSelf'];
  justifyContent: 'flex-start' | 'center' | 'flex-end';
  textAlign: ItLinesUp['textAlign'];
};

type Across = Pick<
  ASignsPlace,
  'left' | 'right' | 'width' | 'maxWidth' | 'alignItems' | 'textAlign'
>;

type Down = Pick<ASignsPlace, 'top' | 'bottom' | 'height' | 'justifyContent'>;

const LEAST_HALF_ACROSS = 1 / 4;

const LEAST_RUN_ACROSS = 1 / 2;

const LEAST_HALF_DOWN = 1 / 8;

/**
 * Holds a distance within the screen, so a point the script put past the edge of what is shown is
 * drawn at the edge rather than off it.
 *
 * @param at - The distance from the screen's left or top.
 * @param most - The screen's width or height.
 * @returns The distance, no further out than the screen.
 */
const onTheScreen = (at: number, most: number): number =>
  Math.min(Math.max(at, 0), Math.max(most, 0));

/**
 * Where a sign sits across the screen, by which of its sides is on the point, in a box never so
 * narrow near an edge that its words fold into a column.
 *
 * @param x - The point, from the screen's left.
 * @param column - Which side is on it.
 * @param wide - The screen's width.
 * @returns The box's sides, and how its words line up in it.
 */
const across = (x: number, column: CueColumn, wide: number): Across => {
  const { alignSelf: alignItems, textAlign } = howItLinesUp(column);

  if (column === 'left') {
    return {
      left: x,
      maxWidth: Math.max(wide - x, wide * LEAST_RUN_ACROSS),
      alignItems,
      textAlign,
    };
  }

  if (column === 'right') {
    return {
      right: wide - x,
      maxWidth: Math.max(x, wide * LEAST_RUN_ACROSS),
      alignItems,
      textAlign,
    };
  }

  const half = Math.max(Math.min(x, wide - x), wide * LEAST_HALF_ACROSS);

  return { left: x - half, width: half * 2, alignItems, textAlign };
};

/**
 * Where a sign sits down the screen, by which of its edges is on the point, in a box never so short
 * near an edge that its words have no room.
 *
 * @param y - The point, from the screen's top.
 * @param row - Which edge is on it.
 * @param tall - The screen's height.
 * @returns The box's edges, and how its words sit in it.
 */
const down = (y: number, row: CueCorner['down'], tall: number): Down => {
  if (row === 'top') {
    return { top: y, justifyContent: 'flex-start' };
  }

  if (row === 'bottom') {
    return { bottom: tall - y, justifyContent: 'flex-end' };
  }

  const half = Math.max(Math.min(y, tall - y), tall * LEAST_HALF_DOWN);

  return { top: y - half, height: half * 2, justifyContent: 'center' };
};

/**
 * Where on the screen to draw a line a script put at a point of its own, such as a sign typeset over
 * the thing it names.
 *
 * The point is a fraction of the film's frame, which is drawn larger than the screen where its bars
 * fall off the edges, so it is found on the frame as drawn and then held on the screen. The keypad
 * alignment says which corner of the words sits on it, so a sign aligned to its bottom right ends at
 * the point rather than starting there. Everything is in points rather than percentages, because a
 * box moved by a fraction of its own size cannot be laid out until it has been measured.
 *
 * @param position - The point, as fractions of the frame across and down.
 * @param alignment - The keypad position, 1 to 9, naming the corner of the words on the point.
 * @param frame - Where the film's whole frame is drawn on the screen.
 * @param screen - The screen's size.
 * @returns The sides of a box drawn absolutely, and how its words line up in it.
 */
const whereASignGoes = (
  position: { x: number; y: number },
  alignment: number,
  frame: AFrame,
  screen: ABox,
): ASignsPlace => {
  const corner = cornerOf(alignment);
  const x = onTheScreen(frame.left + position.x * frame.width, screen.width);
  const y = onTheScreen(frame.top + position.y * frame.height, screen.height);

  return { ...across(x, corner.across, screen.width), ...down(y, corner.down, screen.height) };
};

export type { ASignsPlace };

export { whereASignGoes };
