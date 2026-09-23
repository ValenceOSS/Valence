import type { ReactNode } from 'react';

type APosterGridProps<Item> = {
  header: ReactNode;
  items: readonly Item[];
  keyOf: (item: Item) => string;
  drawn: (item: Item, width: number) => ReactNode;
  across?: number;
  onScrolled?: (isScrolled: boolean) => void;
  onBack?: () => void;
};

export type { APosterGridProps };
