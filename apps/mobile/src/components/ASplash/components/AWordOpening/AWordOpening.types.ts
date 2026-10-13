import type { TextStyle } from 'react-native';

type AWordOpeningProps = {
  word: string;
  isShown: boolean;
  isStill: boolean;
  style: TextStyle;
  before: number;
  onWide: (wide: number) => void;
};

export type { AWordOpeningProps };
