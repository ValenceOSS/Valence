import { cornerOf } from '@ValenceClient/playback/cornerOf';
import type { CSSProperties } from 'react';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

type CuePoint = NonNullable<SubtitleCue['position']>;

const ANCHOR_ACROSS = { left: '0', centre: '-50%', right: '-100%' } as const;

const ANCHOR_DOWN = { bottom: '-100%', middle: '-50%', top: '0' } as const;

const WIDEST = '90%';

/**
 * Works out where on the picture a line goes that the script put at a point of its own.
 *
 * The line is hung from the corner its alignment names, so that `\pos` with a bottom-right alignment
 * puts the bottom right of the text on the point rather than the top left of it. Everything is a
 * fraction of the picture, so a script written for one resolution lands in the same place shown at
 * another.
 *
 * The box is as wide as its words, up to most of the picture, rather than as wide as the room left
 * between the point and the edge, which would fold a sign near the right of the frame into a column
 * a word wide.
 *
 * @param position - The point, as fractions of the picture across and down.
 * @param alignment - The keypad alignment saying which corner of the line sits on the point.
 * @returns Where to put the line's box.
 */
const toCuePlacement = (position: CuePoint, alignment: number): CSSProperties => {
  const { across, down } = cornerOf(alignment);

  return {
    left: `${(position.x * 100).toString()}%`,
    top: `${(position.y * 100).toString()}%`,
    width: 'max-content',
    maxWidth: WIDEST,
    transform: `translate(${ANCHOR_ACROSS[across]}, ${ANCHOR_DOWN[down]})`,
  };
};

export type { CuePoint };

export { toCuePlacement };
