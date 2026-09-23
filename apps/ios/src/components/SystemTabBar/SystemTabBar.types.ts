import type { StyleProp, ViewStyle } from 'react-native';

type ASystemTab = {
  id: string;
  title: string;
  symbol: string;
};

type SystemTabBarProps = {
  tabs: readonly ASystemTab[];
  selected: string;
  accent: string;
  onSelect: (id: string) => void;
  onMeasure: (height: number) => void;
  style: StyleProp<ViewStyle>;
};

type NativeTabBarProps = Omit<SystemTabBarProps, 'onSelect' | 'onMeasure'> & {
  onSelect: (event: { nativeEvent: { id: string } }) => void;
  onMeasure: (event: { nativeEvent: { height: number } }) => void;
};

export type { ASystemTab, NativeTabBarProps, SystemTabBarProps };
