import type { StyleProp, ViewStyle } from 'react-native';
import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';

type ASystemTab = {
  id: string;
  title: string;
  symbol: string;
  picture?: string | null;
  backdrop?: string;
  initial?: string;
};

type SystemTabBarProps = {
  tabs: readonly ASystemTab[];
  selected: string;
  accent: string;
  onSelect: (id: string) => void;
  onMeasure: (height: number) => void;
  onFaceAt?: (at: ARectOnScreen) => void;
  isFaceHidden?: boolean;
  style: StyleProp<ViewStyle>;
};

type NativeTabBarProps = Omit<SystemTabBarProps, 'onSelect' | 'onMeasure' | 'onFaceAt'> & {
  onSelect: (event: { nativeEvent: { id: string } }) => void;
  onMeasure: (event: { nativeEvent: { height: number } }) => void;
  onFaceAt: (event: { nativeEvent: ARectOnScreen }) => void;
};

export type { ASystemTab, NativeTabBarProps, SystemTabBarProps };
