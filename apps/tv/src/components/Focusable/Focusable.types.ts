import type { ReactNode, Ref } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

type FocusableProps = {
  children: ReactNode | ((isFocused: boolean) => ReactNode);
  onPress?: () => void;
  onHold?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  shadow?: { height: number; cornerRadius: number } | null;
  ref?: Ref<View> | undefined;
  label: string;
  hasPreferredFocus?: boolean;
  isDisabled?: boolean;
  scale?: number;
  isAnchoredLeft?: boolean;
  style?: StyleProp<ViewStyle>;
};

export type { FocusableProps };
