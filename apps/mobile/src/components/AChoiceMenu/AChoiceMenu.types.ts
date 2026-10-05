import type { Segment } from '@ValenceMobile/components/SegmentedRow/SegmentedRow.types';

type AChoiceMenuProps = {
  label: string;
  items: readonly Segment[];
  value: string | null;
  onSelect: (id: string) => void;
};

export type { AChoiceMenuProps };
