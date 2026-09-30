import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import { say } from '@ValenceI18n/say';

const LETTER_FONT_LOOKS: Record<LetterFont, { name: string; family: string; weight: number }> = {
  gilroy: {
    name: say('screens.library.letterFontLooks.gilroy'),
    family: "'Gilroy', ui-sans-serif, sans-serif",
    weight: 600,
  },
  manrope: {
    name: say('screens.library.letterFontLooks.manrope'),
    family: "'Manrope', ui-sans-serif, sans-serif",
    weight: 800,
  },
  playfair: {
    name: say('screens.library.letterFontLooks.playfair'),
    family: say('screens.library.letterFontLooks.valencePlayfairUiSerifSerif'),
    weight: 700,
  },
  spaceMono: {
    name: say('screens.library.letterFontLooks.spaceMono'),
    family: say('screens.library.letterFontLooks.valenceSpaceMonoUiMonospaceMonospace'),
    weight: 700,
  },
  bebas: {
    name: say('screens.library.letterFontLooks.bebas'),
    family: say('screens.library.letterFontLooks.valenceBebasUiSansSerifSans'),
    weight: 400,
  },
  pacifico: {
    name: say('screens.library.letterFontLooks.pacifico'),
    family: say('screens.library.letterFontLooks.valencePacificoCursive'),
    weight: 400,
  },
  caveat: {
    name: say('screens.library.letterFontLooks.caveat'),
    family: say('screens.library.letterFontLooks.valenceCaveatCursive'),
    weight: 700,
  },
  pixel: {
    name: say('common.pixel'),
    family: say('screens.library.letterFontLooks.valencePixelUiMonospaceMonospace'),
    weight: 400,
  },
};

export { LETTER_FONT_LOOKS };
