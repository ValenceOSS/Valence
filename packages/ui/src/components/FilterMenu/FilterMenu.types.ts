type FilterOption = {
  id: string;
  label: string;
};

type FilterGroup = {
  name: string;
  options: readonly FilterOption[];
  isSingle?: boolean;
};

type FilterMenuProps = {
  label: string;
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  hasLabel?: boolean;
  onChange: (next: ReadonlySet<string>) => void;
};

export type { FilterGroup, FilterMenuProps, FilterOption };
