import type { Animated } from 'react-native';

type TheTopBarProps = {
  title?: string | undefined;
  scrolled: Animated.Value;
  from: number;
  isPast: boolean;
};

export type { TheTopBarProps };
