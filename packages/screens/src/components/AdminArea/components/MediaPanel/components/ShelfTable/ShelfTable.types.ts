import type { ReactNode } from 'react';
import type { ShelfItem } from '@ValenceScreens/components/AdminArea/components/MediaPanel/ShelfItem.types';

type ShelfTableProps = {
  label: string;
  items: ShelfItem[];
  toolbar: ReactNode;
  emptyMessage: string;
  onOpenFolder?: (path: string) => void;
};

export type { ShelfTableProps };
