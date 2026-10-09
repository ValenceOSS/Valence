import type { StyleProp, ViewStyle } from 'react-native';

type ShadePoint = { x: number; y: number };

type ShadeProps = {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start?: ShadePoint;
  end?: ShadePoint;
  flat: string;
  style?: StyleProp<ViewStyle>;
};

export type { ShadePoint, ShadeProps };
