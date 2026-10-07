import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type FocusGuideProps = {
  isRemembering?: boolean;
  trapsUp?: boolean;
  trapsDown?: boolean;
  trapsLeft?: boolean;
  trapsRight?: boolean;
  onFocusInside?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export type { FocusGuideProps };
