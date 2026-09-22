type Segment = {
  id: string;
  label: string;
};

type SegmentedRowProps = {
  label: string;
  items: readonly Segment[];
  value: string | null;
  onSelect: (id: string) => void;
};

export type { Segment, SegmentedRowProps };
