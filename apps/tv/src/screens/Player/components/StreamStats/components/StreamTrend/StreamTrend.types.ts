type StreamTrendProps = {
  title: string;
  label: string;
  values: readonly (number | null)[];
  ceiling: number;
  scale: string;
  newest: string | null;
  slots: number;
};

export type { StreamTrendProps };
