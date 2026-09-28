import {
  columnFilteringFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table';

type DataTableColumnMeta = {
  filterOptions?: readonly { id: string; label: string }[];
  shrinks?: boolean;
};

const columnMeta: DataTableColumnMeta = {};

const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  columnMeta,
});

export { dataTableFeatures };
export type { DataTableColumnMeta };
