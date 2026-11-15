import type { ReactNode } from 'react';

type AShelfRowProps<Item> = {
  items: readonly Item[];
  keyOf: (item: Item, at: number) => string;
  drawn: (item: Item, at: number) => ReactNode;
  cardWidth?: number;
};

export type { AShelfRowProps };
