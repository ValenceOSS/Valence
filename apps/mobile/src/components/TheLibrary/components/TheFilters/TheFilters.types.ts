import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';
import type { FilterGroup } from '@ValenceClient/library/FilterGroup';

type TheFiltersProps = {
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
  onClear: () => void;
  arrangement: Arrangement;
  onArrange: (arrangement: Arrangement) => void;
};

export type { TheFiltersProps };
