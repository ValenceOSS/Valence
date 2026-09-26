import type { StyleProp, ViewStyle } from 'react-native';

type APageCurlProps = {
  pages: readonly string[];
  page: number;
  isTwoUp: boolean;
  isCoverAlone: boolean;
  isRightToLeft: boolean;
  paper: string;
  fit: 'both' | 'width' | 'height';
  isLocked: boolean;
  onTurn: (page: number) => void;
  onMiddle: () => void;
  onPastTheEnd: () => void;
  onPaper: (colour: string) => void;
  style: StyleProp<ViewStyle>;
};

type NativePageCurlProps = Omit<
  APageCurlProps,
  'onTurn' | 'onMiddle' | 'onPastTheEnd' | 'onPaper'
> & {
  onTurn: (event: { nativeEvent: { page: number } }) => void;
  onMiddle: () => void;
  onPastTheEnd: () => void;
  onPaper: (event: { nativeEvent: { colour: string } }) => void;
};

export type { APageCurlProps, NativePageCurlProps };
