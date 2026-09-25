import type { FilterGroup } from '@ValenceClient/library/FilterGroup';

type TheFiltersProps = {
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
  onClear: () => void;
};

export type { TheFiltersProps };
