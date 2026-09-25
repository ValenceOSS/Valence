type NumberedRowProps = {
  label: string;
  title: string;
  detail?: string;
  aside?: string;
  length: number;
  place: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPress: (place: number) => void;
  onFocus?: (place: number) => void;
};

export type { NumberedRowProps };
