type LyricLineProps = {
  text: string;
  distance: number;
  canSeek: boolean;
  onPress: () => void;
  onFocus: () => void;
  onLayout: (top: number, height: number) => void;
};

export type { LyricLineProps };
