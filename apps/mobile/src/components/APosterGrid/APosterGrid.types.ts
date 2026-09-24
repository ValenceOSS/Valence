import type { ReactNode } from 'react';

type APosterGridProps<Item> = {
  header: ReactNode;
  items: readonly Item[];
  keyOf: (item: Item) => string;
  drawn: (item: Item, width: number) => ReactNode;
  across?: number;
  onScrolled?: (isScrolled: boolean) => void;
  onScrolledTo?: (y: number) => void;
  onNearTheEnd?: () => void;
  footer?: ReactNode;
  onBack?: () => void;
};

export type { APosterGridProps };
