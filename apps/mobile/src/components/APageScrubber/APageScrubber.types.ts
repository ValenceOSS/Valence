import type { StyleProp, ViewStyle } from 'react-native';

type APageScrubberProps = {
  pictures: readonly string[];
  page: number;
  ink: string;
  onPage: (page: number) => void;
  style: StyleProp<ViewStyle>;
};

type NativePageScrubberProps = Omit<APageScrubberProps, 'onPage'> & {
  breadth: number;
  tall: number;
  onPage: (event: { nativeEvent: { page: number } }) => void;
};

export type { APageScrubberProps, NativePageScrubberProps };
