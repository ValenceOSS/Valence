import type { ColumnDef, RowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { dataTableFeatures } from './dataTableFeatures';

type DataTableSorting = {
  id: string;
  isDescending: boolean;
};

type DataTableColumn<Row extends RowData> = ColumnDef<typeof dataTableFeatures, Row>;

type DataTableProps<Row extends RowData> = {
  label: string;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  totalRows?: number;
  emptyMessage?: string;
  onChooseRow?: (row: Row) => void;
  onReorder?: (ids: string[]) => void;
  getRowId?: (row: Row) => string;
  toolbar?: ReactNode;
  getSubRows?: (row: Row) => readonly Row[] | undefined;
  isOpenAtFirst?: boolean;
  pageSize?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  growsOnScroll?: boolean;
  height?: 'compact' | 'fill' | 'parent' | 'fills';
  sorting?: DataTableSorting | null;
  onSortingChange?: (sorting: DataTableSorting | null) => void;
  filters?: Readonly<Record<string, string>>;
  onFiltersChange?: (id: string, value: string | undefined) => void;
  className?: string;
};

export type { DataTableColumn, DataTableProps, DataTableSorting };
