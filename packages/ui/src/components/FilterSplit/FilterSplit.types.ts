import type { FilterGroup } from '@ValenceUI/FilterMenu.types';

type FilterSplitProps = {
  label: string;
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
  className?: string;
};

export type { FilterSplitProps };
