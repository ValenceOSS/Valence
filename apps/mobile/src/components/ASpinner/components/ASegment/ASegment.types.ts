import type { Animated } from 'react-native';

type ASegmentProps = {
  glow: Animated.Value | Animated.AnimatedInterpolation<number>;
  colour: string;
  at: number;
  count: number;
  length: number;
  stroke: number;
  radius: number;
};

export type { ASegmentProps };
