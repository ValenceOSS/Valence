import type { FilterGroup } from '@ValenceUI/FilterMenu.types';

type AppliedFiltersProps = {
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export type { AppliedFiltersProps };
