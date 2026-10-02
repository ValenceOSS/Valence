import type { FilterGroup } from '@ValenceClient/library/FilterGroup';

type FilterPanelProps = {
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
  onClose: () => void;
};

export type { FilterPanelProps };
