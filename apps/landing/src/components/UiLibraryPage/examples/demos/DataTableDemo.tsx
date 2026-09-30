import { DataTable } from '@ValenceUI/DataTable';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';

type Film = { id: string; title: string; year: number; gigabytes: number };

const FILMS: Film[] = [
  { id: 'arrival', title: 'Arrival', year: 2016, gigabytes: 12.4 },
  { id: 'dune', title: 'Dune', year: 2021, gigabytes: 58.1 },
  { id: 'sicario', title: 'Sicario', year: 2015, gigabytes: 9.8 },
  { id: 'blade-runner', title: 'Blade Runner 2049', year: 2017, gigabytes: 44.6 },
  { id: 'prisoners', title: 'Prisoners', year: 2013, gigabytes: 11.2 },
];

const COLUMNS: DataTableColumn<Film>[] = [
  { id: 'title', header: 'Title', accessorFn: (film) => film.title },
  { id: 'year', header: 'Year', accessorFn: (film) => film.year },
  {
    id: 'size',
    header: 'Size',
    accessorFn: (film) => film.gigabytes,
    cell: ({ row }) => `${row.original.gigabytes.toFixed(1)} GB`,
  },
];

/**
 * A table of films, sortable by any column, as the admin pages draw their lists.
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
