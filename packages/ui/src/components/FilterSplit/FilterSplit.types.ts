import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import type { ScopedChoice } from '@ValenceUI/ScopedField.types';

type FilterSplitProps = {
  label: string;
  scope?: ScopedChoice;
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
  className?: string;
};

export type { FilterSplitProps };
