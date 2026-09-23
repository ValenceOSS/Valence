import type { Segment } from '@ValencePhone/components/SegmentedRow/SegmentedRow.types';

type ACapsuleRowProps = {
  label: string;
  items: readonly Segment[];
  value: string | null;
  onSelect: (id: string) => void;
};

export type { ACapsuleRowProps };
