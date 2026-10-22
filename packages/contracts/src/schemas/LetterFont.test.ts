import { describe, expect, it } from 'vitest';
import { LETTER_FONTS, LetterFontSchema, PLUS_JAKARTA_SANS_AS_STORED } from './LetterFont';

describe('LetterFontSchema', () => {
  it('reads every letter font by the name it is stored under', () => {
    for (const font of LETTER_FONTS) {
      expect(LetterFontSchema.parse(font)).toBe(font);
    }
  });

  it('reads the name the interface face will be stored under as the one it is stored under now', () => {
    expect(LetterFontSchema.parse('plusJakartaSans')).toBe(PLUS_JAKARTA_SANS_AS_STORED);
  });

  it('refuses a font it does not know', () => {
    expect(LetterFontSchema.safeParse('comicSans').success).toBe(false);
  });
});
