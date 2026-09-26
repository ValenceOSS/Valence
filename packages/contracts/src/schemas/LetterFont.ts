import { z } from 'zod';

const LETTER_FONTS = [
  'gilroy',
  'manrope',
  'playfair',
  'spaceMono',
  'bebas',
  'pacifico',
  'caveat',
  'pixel',
] as const;

const LetterFontSchema = z.enum(LETTER_FONTS);

type LetterFont = z.infer<typeof LetterFontSchema>;

export type { LetterFont };

export { LETTER_FONTS, LetterFontSchema };
