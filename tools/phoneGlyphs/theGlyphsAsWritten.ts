import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { theDrawingOf } from './theDrawingOf';
import { theGlyphAsWritten } from './theGlyphAsWritten';
import { theGlyphsToDraw } from './theGlyphsToDraw';

const THE_SET = '@keyline-icons/react';

/**
 * The phone's icons, as the modules that hold them should read.
 *
 * Answered rather than written, so the same answer can be compared against what is checked in. An
 * icon set that moves under us is then a failing test rather than a phone drawing yesterday's
 * shapes.
 *
 * @returns Each icon's file name against what should be in it.
 */
const theGlyphsAsWritten = (): Map<string, string> => {
  const where = createRequire(import.meta.url).resolve(THE_SET);
  const source = readFileSync(where, 'utf8');

  return new Map(
    theGlyphsToDraw.map((name) => [
      `${name}.tsx`,
      theGlyphAsWritten(name, theDrawingOf(source, name)),
    ]),
  );
};

export { THE_SET, theGlyphsAsWritten };
