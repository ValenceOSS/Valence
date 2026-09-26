import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';

const LETTER_FONT_LOOKS: Record<LetterFont, { name: string; family: string; weight: number }> = {
  gilroy: { name: 'Gilroy', family: "'Gilroy', ui-sans-serif, sans-serif", weight: 600 },
  manrope: { name: 'Manrope', family: "'Manrope', ui-sans-serif, sans-serif", weight: 800 },
  playfair: { name: 'Playfair', family: "'Valence Playfair', ui-serif, serif", weight: 700 },
  spaceMono: {
    name: 'Space Mono',
    family: "'Valence Space Mono', ui-monospace, monospace",
    weight: 700,
  },
  bebas: { name: 'Bebas', family: "'Valence Bebas', ui-sans-serif, sans-serif", weight: 400 },
  pacifico: { name: 'Pacifico', family: "'Valence Pacifico', cursive", weight: 400 },
  caveat: { name: 'Caveat', family: "'Valence Caveat', cursive", weight: 700 },
  pixel: { name: 'Pixel', family: "'Valence Pixel', ui-monospace, monospace", weight: 400 },
};

export { LETTER_FONT_LOOKS };
