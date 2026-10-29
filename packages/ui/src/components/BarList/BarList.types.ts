type BarListItem = {
  id: string;
  label: string;
  value: number;
  detail?: string;
};

type BarListProps = {
  items: readonly BarListItem[];
  label: string;
  heading: string;
  valueHeading: string;
  emptyMessage: string;
  figureOf?: (item: BarListItem) => string;
  chosen?: ReadonlySet<string>;
  onChoose?: (id: string) => void;
  fill?: 'striped' | 'solid';
  className?: string;
};

export type { BarListItem, BarListProps };
