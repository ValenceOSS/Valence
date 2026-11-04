import { DataTable } from '@ValenceUI/DataTable';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';

type Film = { id: string; title: string; year: number; gigabytes: number };

const FILMS: Film[] = [
  { id: 'a', title: 'Film A', year: 2016, gigabytes: 12.4 },
  { id: 'b', title: 'Film B', year: 2021, gigabytes: 58.1 },
  { id: 'c', title: 'Film C', year: 2015, gigabytes: 9.8 },
  { id: 'd', title: 'Film D', year: 2017, gigabytes: 44.6 },
  { id: 'e', title: 'Film E', year: 2013, gigabytes: 11.2 },
];

const COLUMNS: DataTableColumn<Film>[] = [
  { id: 'title', header: 'Title', accessorFn: (film) => film.title },
  { id: 'year', header: 'Year', accessorFn: (film) => film.year },
  {
    id: 'size',
    header: 'Size',
    meta: { info: 'The space the file takes on the disk.', hasLineBefore: true },
    accessorFn: (film) => film.gigabytes,
    cell: ({ row }) => `${row.original.gigabytes.toFixed(1)} GB`,
  },
];

/**
 * A table of films, sortable by any column, as the admin pages draw their lists, with an ⓘ beside
 * one heading and a line before its column.
 */
const DataTableDemo = () => (
  <div className="w-full">
    <DataTable
      label="Films"
      columns={COLUMNS}
      rows={FILMS}
      getRowId={(film) => film.id}
      height="compact"
    />
  </div>
);

DataTableDemo.displayName = 'DataTableDemo';

export { DataTableDemo };
