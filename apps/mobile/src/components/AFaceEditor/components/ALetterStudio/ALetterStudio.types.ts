import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type ALetterStudioProps = {
  name: string;
  font: LetterFont;
  colour: ProfileColour;
  onFont: (font: LetterFont) => void;
  onColour: (colour: ProfileColour) => void;
};

export type { ALetterStudioProps };
