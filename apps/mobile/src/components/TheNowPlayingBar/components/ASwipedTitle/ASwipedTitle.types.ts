import type { ReactNode } from 'react';
import type { Animated } from 'react-native';

type ASwipedTitleProps = {
  shift: Animated.Value;
  previous: ReactNode;
  current: ReactNode;
  next: ReactNode;
  onWidth: (width: number) => void;
};

export type { ASwipedTitleProps };
