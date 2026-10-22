import { z } from 'zod';

const PLUS_JAKARTA_SANS_AS_STORED = 'gilroy' as const;

const PLUS_JAKARTA_SANS_TO_COME = 'plusJakartaSans' as const;

const LETTER_FONTS = [
  PLUS_JAKARTA_SANS_AS_STORED,
  'manrope',
  'playfair',
  'spaceMono',
  'bebas',
  'pacifico',
  'caveat',
  'pixel',
] as const;

const LetterFontSchema = z
  .enum([...LETTER_FONTS, PLUS_JAKARTA_SANS_TO_COME])
  .transform((font) => (font === PLUS_JAKARTA_SANS_TO_COME ? PLUS_JAKARTA_SANS_AS_STORED : font));

type LetterFont = z.infer<typeof LetterFontSchema>;

export type { LetterFont };

export { LETTER_FONTS, LetterFontSchema, PLUS_JAKARTA_SANS_AS_STORED };
