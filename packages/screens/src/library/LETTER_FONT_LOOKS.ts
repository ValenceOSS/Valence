import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import { say } from '@ValenceI18n/say';
import { LETTER_FONT_NAMES } from '@ValenceClient/profiles/LETTER_FONT_NAMES';

const LETTER_FONT_LOOKS: Record<
  LetterFont,
  { name: string; shortName?: string; family: string; weight: number }
> = {
  [PLUS_JAKARTA_SANS_AS_STORED]: {
    name: say(LETTER_FONT_NAMES[PLUS_JAKARTA_SANS_AS_STORED].name),
    shortName: say(LETTER_FONT_NAMES[PLUS_JAKARTA_SANS_AS_STORED].shortName),
    family: "'Plus Jakarta Sans', ui-sans-serif, sans-serif",
    weight: 600,
  },
  manrope: {
    name: say(LETTER_FONT_NAMES.manrope.name),
    family: "'Manrope', ui-sans-serif, sans-serif",
    weight: 800,
  },
  playfair: {
    name: say(LETTER_FONT_NAMES.playfair.name),
    family: say('screens.library.letterFontLooks.valencePlayfairUiSerifSerif'),
    weight: 700,
  },
  spaceMono: {
    name: say(LETTER_FONT_NAMES.spaceMono.name),
    family: say('screens.library.letterFontLooks.valenceSpaceMonoUiMonospaceMonospace'),
    weight: 700,
  },
  bebas: {
    name: say(LETTER_FONT_NAMES.bebas.name),
    family: say('screens.library.letterFontLooks.valenceBebasUiSansSerifSans'),
    weight: 400,
  },
  pacifico: {
    name: say(LETTER_FONT_NAMES.pacifico.name),
    family: say('screens.library.letterFontLooks.valencePacificoCursive'),
    weight: 400,
  },
  caveat: {
    name: say(LETTER_FONT_NAMES.caveat.name),
    family: say('screens.library.letterFontLooks.valenceCaveatCursive'),
    weight: 700,
  },
  pixel: {
    name: say(LETTER_FONT_NAMES.pixel.name),
    family: say('screens.library.letterFontLooks.valencePixelUiMonospaceMonospace'),
    weight: 400,
  },
};

export { LETTER_FONT_LOOKS };
