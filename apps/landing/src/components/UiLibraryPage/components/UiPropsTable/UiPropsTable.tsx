import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { UiPropsTableProps } from './UiPropsTable.types';

type DocumentedProp = UiPropsTableProps['doc']['props'][number];

const COLUMNS: DataTableColumn<DocumentedProp>[] = [
  {
    id: 'name',
    header: 'Prop',
    accessorFn: (prop) => prop.name,
    cell: ({ row }) => (
      <span className="flex min-w-36 flex-wrap items-center gap-2">
        <code className="font-mono text-[0.8125rem] font-semibold text-text">
          {row.original.name}
        </code>
        {row.original.isRequired ? (
          <Badge tone="accent" size="sm">
            Required
          </Badge>
        ) : null}
      </span>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    accessorFn: (prop) => prop.type,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.values.length === 0 ? (
        <code className="font-mono text-[0.8125rem] text-text-muted">{row.original.type}</code>
      ) : (
        <span className="flex flex-wrap gap-1">
          {row.original.values.map((value) => (
            <code
              key={value}
              className="rounded-md bg-[var(--surface-hover)] px-1.5 py-0.5 font-mono text-xs text-text"
            >
              {value}
            </code>
          ))}
        </span>
      ),
  },
  {
    id: 'default',
    header: 'Default',
    accessorFn: (prop) => prop.defaultValue ?? '',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.defaultValue === null ? (
        <span className="text-text-muted">—</span>
      ) : (
        <code className="font-mono text-[0.8125rem] text-text">{row.original.defaultValue}</code>
      ),
  },
  {
    id: 'description',
    header: 'What it is for',
    accessorFn: (prop) => prop.description ?? '',
    enableSorting: false,
    meta: { fills: true },
    cell: ({ row }) => (
      <span className="block text-text-muted">{row.original.description ?? '—'}</span>
    ),
  },
];

/**
 * Every prop a component takes, as it documents them: the name, whether it must be given, its type —
 * spelled out as the values it accepts where it is one of a few words — its default, and what it is
 * for. Anything the props inherit from elsewhere, such as a native button's attributes, is named
 * under the table rather than listed out.
 *
 * @param doc - What the component documents about itself.
 */
const UiPropsTable = ({ doc }: UiPropsTableProps) => (
  <div className="flex flex-col gap-3">
    {doc.props.length === 0 ? (
      <p className="text-sm text-text-muted">{doc.name} takes no props of its own.</p>
    ) : (
      <DataTable
        label={`Props of ${doc.name}`}
        columns={COLUMNS}
        rows={[...doc.props]}
        getRowId={(prop) => prop.name}
        pageSize={doc.props.length}
        height="parent"
      />
    )}

    {doc.inherits.length === 0 ? null : (
      <p className="text-sm text-text-muted">
        Also takes everything from{' '}
        {doc.inherits.map((inherited, at) => (
          <span key={inherited}>
            {at === 0 ? '' : ', '}
            <code className="font-mono text-[0.8125rem] text-text">{inherited}</code>
          </span>
        ))}
        .
      </p>
    )}
  </div>
);

UiPropsTable.displayName = 'UiPropsTable';

export { UiPropsTable };
