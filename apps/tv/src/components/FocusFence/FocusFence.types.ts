import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type FocusFenceProps = {
  isShut: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export type { FocusFenceProps };
