import type { ReactNode } from 'react';

type AShelfOfThings = {
  title: string;
  onSeeAll?: () => void;
  children: ReactNode;
  items?: never;
};

type AShelfOfItems<Item> = {
  title: string;
  onSeeAll?: () => void;
  items: readonly Item[];
  keyOf: (item: Item) => string;
  drawn: (item: Item, at: number) => ReactNode;
  cardWidth?: number;
  children?: never;
};

type AShelfProps<Item> = AShelfOfThings | AShelfOfItems<Item>;

export type { AShelfProps };
