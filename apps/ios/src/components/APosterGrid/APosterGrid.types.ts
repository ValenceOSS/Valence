import type { ReactNode } from 'react';

type APosterGridProps<Item> = {
  header: ReactNode;
  items: readonly Item[];
  keyOf: (item: Item) => string;
  drawn: (item: Item) => ReactNode;
};

export type { APosterGridProps };
