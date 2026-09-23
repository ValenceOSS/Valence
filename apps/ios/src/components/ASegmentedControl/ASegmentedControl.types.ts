type ASegmentedControlProps = {
  label: string;
  items: readonly { id: string; label: string }[];
  value: string | null;
  onSelect: (id: string) => void;
};

type NativeSegmentedControlProps = {
  labels: string[];
  picked: number;
  isDark: boolean;
  accessibilityLabel: string;
  style: { height: number };
  onChoose: (event: { nativeEvent: object }) => void;
};

export type { ASegmentedControlProps, NativeSegmentedControlProps };
