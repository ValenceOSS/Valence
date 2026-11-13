import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import type { StringKey } from '@ValenceI18n/StringKey';

const LETTER_FONT_NAMES = {
  [PLUS_JAKARTA_SANS_AS_STORED]: {
    name: 'screens.library.letterFontLooks.plusJakartaSans',
    shortName: 'screens.library.letterFontLooks.pJakarta',
  },
  manrope: { name: 'screens.library.letterFontLooks.manrope' },
  playfair: { name: 'screens.library.letterFontLooks.playfair' },
  spaceMono: { name: 'screens.library.letterFontLooks.spaceMono' },
  bebas: { name: 'screens.library.letterFontLooks.bebas' },
  pacifico: { name: 'screens.library.letterFontLooks.pacifico' },
  caveat: { name: 'screens.library.letterFontLooks.caveat' },
  pixel: { name: 'common.pixel' },
} as const satisfies Record<LetterFont, { name: StringKey; shortName?: StringKey }>;

export { LETTER_FONT_NAMES };
