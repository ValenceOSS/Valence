import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type FocusableProps = {
  children: ReactNode | ((isFocused: boolean) => ReactNode);
  onPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  hasShadow?: boolean;
  label: string;
  hasPreferredFocus?: boolean;
  isDisabled?: boolean;
  scale?: number;
  style?: StyleProp<ViewStyle>;
};

export type { FocusableProps };
