import type { ColumnDef, RowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { dataTableFeatures } from './dataTableFeatures';

type DataTableColumn<Row extends RowData> = ColumnDef<typeof dataTableFeatures, Row>;

type DataTableProps<Row extends RowData> = {
  label: string;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  totalRows?: number;
  emptyMessage?: string;
  onChooseRow?: (row: Row) => void;
  getRowId?: (row: Row) => string;
  toolbar?: ReactNode;
  getSubRows?: (row: Row) => readonly Row[] | undefined;
  pageSize?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  growsOnScroll?: boolean;
  height?: 'compact' | 'fill' | 'parent' | 'fills';
  className?: string;
};

export type { DataTableColumn, DataTableProps };
