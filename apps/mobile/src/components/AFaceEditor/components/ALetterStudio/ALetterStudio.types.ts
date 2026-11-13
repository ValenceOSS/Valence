import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type ALetterStudioProps = {
  name: string;
  font: LetterFont;
  colour: ProfileColour;
  colourTo: ProfileColour | null;
  onFont: (font: LetterFont) => void;
  onColour: (colour: ProfileColour) => void;
  onGradient: (from: ProfileColour, to: ProfileColour) => void;
};

export type { ALetterStudioProps };
