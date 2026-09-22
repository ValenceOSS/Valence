type FilterGroup = {
  name: string;
  options: readonly { id: string; label: string }[];
  isSingle?: boolean;
};

export type { FilterGroup };
