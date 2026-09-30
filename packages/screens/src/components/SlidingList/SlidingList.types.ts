import type { ReactNode } from 'react';

type SlidingListProps<Item> = {
  items: readonly Item[];
  keyOf: (item: Item) => string;
  renderItem: (item: Item) => ReactNode;
  label?: string;
};

export type { SlidingListProps };
