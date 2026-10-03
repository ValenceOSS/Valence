import {
  MoreHorizontal as MoreHorizontalIcon,
  Search as SearchFilledIcon,
} from '@keyline-icons/react/fill';
import { useMemo } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { FolderLink } from '@ValenceScreens/components/FolderLink/FolderLink';
import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { ShelfItem } from '@ValenceScreens/components/AdminArea/components/MediaPanel/ShelfItem.types';
import type { ShelfTableProps } from './ShelfTable.types';
import { say } from '@ValenceI18n/say';

/**
 * A library of albums or books as the media panel lists it: each with its cover, its name and year,
 * a line about it, where it is on the disk, its size where it has one, when it arrived, and a way to correct what it was
 * matched to.
 *
 * @param label - What the table lists, read out to anybody who cannot see it.
 * @param items - What is on the shelf.
 * @param toolbar - What sits above the table.
 * @param emptyMessage - What to say when nothing is listed.
 * @param onOpenFolder - Called with a folder to open in Files, where the file manager is offered.
 */
const ShelfTable = ({ label, items, toolbar, emptyMessage, onOpenFolder }: ShelfTableProps) => {
  const columns = useMemo<DataTableColumn<ShelfItem>[]>(
    () => [
      {
        id: 'title',
        meta: { fills: true },
        header: say('common.title'),
        accessorFn: (item) => item.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-3">
            <MediaPoster src={row.original.cover} isSquare={row.original.isSquare} />

            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-medium text-text">{row.original.name}</span>

                {row.original.year === null ? null : (
                  <span className="text-sm tabular-nums text-text-muted">{row.original.year}</span>
                )}
              </span>

              <span className="truncate text-xs text-text-muted">{row.original.detail}</span>

              {row.original.place === null || onOpenFolder === undefined ? null : (
                <FolderLink
                  shown={row.original.place.shown}
                  folder={row.original.place.folder}
                  onOpen={onOpenFolder}
                />
              )}
            </span>
          </span>
        ),
      },
      {
        id: 'size',
        header: say('common.size'),
        accessorFn: (item) => item.sizeBytes ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'added',
        header: say('common.added'),
        accessorFn: (item) => item.addedAt,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {new Date(row.original.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const correct = row.original.onCorrect;

          return correct === null ? null : (
            <span className="flex justify-end">
              <ActionMenu
                label={say('common.actionsForName', { name: row.original.name })}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      {
                        id: 'wrong-match',
                        label: say('common.wrongMatch'),
                        icon: <Icon of={SearchFilledIcon} size={15} />,
                        onChoose: correct,
                      },
                    ],
                  },
                ]}
              />
            </span>
          );
        },
      },
    ],
    [onOpenFolder],
  );

  return (
    <DataTable
      label={label}
      columns={columns}
      rows={items}
      getRowId={(item) => item.id}
      pageSize={25}
      height="fills"
      {...(toolbar === undefined ? {} : { toolbar })}
      emptyMessage={emptyMessage}
    />
  );
};

ShelfTable.displayName = 'ShelfTable';

export { ShelfTable };
