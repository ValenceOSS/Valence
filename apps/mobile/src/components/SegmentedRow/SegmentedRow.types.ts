import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';

type Segment = {
  id: string;
  label: string;
  icon?: AGlyph;
};

type SegmentedRowProps = {
  label: string;
  items: readonly Segment[];
  value: string | null;
  onSelect: (id: string) => void;
  fills?: boolean;
  isShown?: boolean;
};

export type { Segment, SegmentedRowProps };
