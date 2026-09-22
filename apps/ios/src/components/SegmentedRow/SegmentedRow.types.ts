type Segment = {
  id: string;
  label: string;
};

type SegmentedRowProps = {
  label: string;
  items: readonly Segment[];
  value: string | null;
  onSelect: (id: string) => void;
  isGlass?: boolean;
  scrolls?: boolean;
};

export type { Segment, SegmentedRowProps };
