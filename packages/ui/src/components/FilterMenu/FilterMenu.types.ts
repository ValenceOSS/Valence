type FilterOption = {
  id: string;
  label: string;
};

type FilterGroup = {
  name: string;
  options: readonly FilterOption[];
};

type FilterMenuProps = {
  label: string;
  groups: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
};

export type { FilterGroup, FilterMenuProps, FilterOption };
