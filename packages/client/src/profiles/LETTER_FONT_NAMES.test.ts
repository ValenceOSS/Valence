import { describe, expect, it } from 'vitest';
import { LETTER_FONTS } from '@ValenceContracts/schemas/LetterFont';
import { say } from '@ValenceI18n/say';
import { LETTER_FONT_NAMES } from './LETTER_FONT_NAMES';

describe('LETTER_FONT_NAMES', () => {
  it('names every font, each differently', () => {
    const names = LETTER_FONTS.map((font) => say(LETTER_FONT_NAMES[font].name));

    expect(new Set(names).size).toBe(LETTER_FONTS.length);
  });
});
