import type { StyleProp, ViewStyle } from 'react-native';

type APageScrubberProps = {
  pictures: readonly string[];
  page: number;
  ink: string;
  isAcross?: boolean;
  onPage: (page: number) => void;
  onScrubbing?: (page: number) => void;
  style: StyleProp<ViewStyle>;
};

type NativePageScrubberProps = Omit<APageScrubberProps, 'onPage' | 'onScrubbing'> & {
  breadth: number;
  tall: number;
  onPage: (event: { nativeEvent: { page: number } }) => void;
  onScrubbing: (event: { nativeEvent: { page: number } }) => void;
};

export type { APageScrubberProps, NativePageScrubberProps };
