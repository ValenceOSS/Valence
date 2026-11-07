import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type LetterStudioProps = {
  name: string;
  colour: ProfileColour;
  colourTo: ProfileColour | null;
  font: LetterFont;
  onColour: (colour: ProfileColour) => void;
  onGradient: (from: ProfileColour, to: ProfileColour) => void;
  onFont: (font: LetterFont) => void;
};

export type { LetterStudioProps };
