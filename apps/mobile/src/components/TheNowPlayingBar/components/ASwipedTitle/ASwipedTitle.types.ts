import type { ReactNode } from 'react';
import type { Animated } from 'react-native';

type ASwipedTitleProps = {
  shift: Animated.Value;
  by: number;
  children: ReactNode;
};

export type { ASwipedTitleProps };
