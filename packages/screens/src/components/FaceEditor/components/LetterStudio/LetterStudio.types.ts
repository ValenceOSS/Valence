import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type LetterStudioProps = {
  name: string;
  colour: ProfileColour;
  font: LetterFont;
  onColour: (colour: ProfileColour) => void;
  onFont: (font: LetterFont) => void;
};

export type { LetterStudioProps };
