import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { theGlyphsAsWritten } from './theGlyphsAsWritten';
import { theGlyphsToDraw } from './theGlyphsToDraw';

const WHERE = resolve(
  import.meta.dirname,
  '..',
  '..',
  'apps',
  'ios',
  'src',
  'theme',
  'theGlyphs.ts',
);

describe('the phone’s glyphs', () => {
  it('are the ones the set draws today, rather than the ones it drew when they were written', () => {
    expect(readFileSync(WHERE, 'utf8')).toBe(theGlyphsAsWritten());
  });

  it('hold every glyph the phone asks for', () => {
    const written = readFileSync(WHERE, 'utf8');

    for (const name of theGlyphsToDraw) {
      expect(written).toContain(`${name}: '<svg`);
    }
  });
});
