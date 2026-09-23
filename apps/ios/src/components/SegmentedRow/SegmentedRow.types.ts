import type { AGlyph } from '@ValencePhone/components/Icon/Icon.types';

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
  isGlass?: boolean;
  scrolls?: boolean;
  isSystem?: boolean;
};

export type { Segment, SegmentedRowProps };
