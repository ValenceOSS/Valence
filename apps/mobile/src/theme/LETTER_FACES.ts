import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';

const LETTER_FACES: Record<LetterFont, string> = {
  gilroy: FONTS.sans.semibold,
  manrope: FONTS.body.extrabold,
  playfair: 'PlayfairDisplay-Bold',
  spaceMono: 'SpaceMono-Bold',
  bebas: 'BebasNeue-Regular',
  pacifico: 'Pacifico-Regular',
  caveat: 'Caveat-Bold',
  pixel: 'PressStart2P-Regular',
};

export { LETTER_FACES };
