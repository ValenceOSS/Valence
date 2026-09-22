import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { theSvgFor } from './theSvgFor';
import { theGlyphsToDraw } from './theGlyphsToDraw';

const THE_SET = '@keyline-icons/react';

/**
 * The phone's icons, as the module that holds them should read.
 *
 * Answered rather than written, so the same answer can be compared against what is checked in. An
 * icon set that moves under us is then a failing test rather than a phone drawing yesterday's
 * shapes.
 *
 * @returns What `theGlyphs.ts` should contain.
 */
const theGlyphsAsWritten = (): string => {
  const where = createRequire(import.meta.url).resolve(THE_SET);
  const source = readFileSync(where, 'utf8');
  const drawn = theGlyphsToDraw
    .map((name) => `  ${name}: '${theSvgFor(source, name)}',`)
    .join('\n');

  return `const theGlyphs = {\n${drawn}\n} as const;\n\nexport { theGlyphs };\n`;
};

export { THE_SET, theGlyphsAsWritten };
