import { useMemo } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Tooltip } from '@ValenceUI/Tooltip';
import { TITLE_PART_LOOKS } from '@ValenceScreens/requests/TITLE_PART_LOOKS';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { TitleEpisode } from '@ValenceClient/requests/seasonsOfTitle';
import type { EpisodeTableProps } from './EpisodeTable.types';
import { say } from '@ValenceI18n/say';

/**
 * A season's episodes on a title page, a row each: its number and title, when it aired, where it
 * stands — with why, on hover, where something went wrong — and the file it is, its whole path on
 * hover.
 *
 * @param label - What the table is of, for somebody who cannot see it.
 * @param episodes - The episodes.
 */
const EpisodeTable = ({ label, episodes }: EpisodeTableProps) => {
  const columns = useMemo<DataTableColumn<TitleEpisode>[]>(
    () => [
      {
        id: 'number',
        header: '#',
        accessorFn: (episode) => episode.episode,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">{row.original.episode}</span>
        ),
      },
      {
        id: 'title',
        header: say('common.episode'),
        accessorFn: (episode) => episode.title,
        cell: ({ row }) => (
          <span className="block max-w-64 truncate text-sm font-medium text-text">
            {row.original.title}
          </span>
        ),
      },
      {
        id: 'aired',
        header: say('client.library.describeTitleDetails.aired'),
        accessorFn: (episode) => episode.airDate ?? '',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text-muted">
            {row.original.airDate === null
              ? '—'
              : new Date(`${row.original.airDate}T12:00:00Z`).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
          </span>
        ),
      },
      {
        id: 'status',
        header: say('common.status'),
        enableSorting: false,
        cell: ({ row }) => {
          const look = TITLE_PART_LOOKS[row.original.part];

          return (
            <Tooltip label={row.original.problem ?? ''} isDisabled={row.original.problem === null}>
              <span
                tabIndex={row.original.problem === null ? undefined : 0}
                className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <Badge size="sm" tone={look.tone}>
                  {look.label}
                </Badge>
              </span>
            </Tooltip>
          );
        },
      },
      {
        id: 'file',
        header: say('screens.adminArea.titlePage.episodeTable.fileName'),
        enableSorting: false,
        cell: ({ row }) => {
          const { path } = row.original;

          return path === null ? (
            <span className="text-xs text-text-muted">—</span>
          ) : (
            <Tooltip label={path}>
              <span
                tabIndex={0}
                className="block max-w-52 truncate text-xs text-text-muted outline-none"
              >
                {path.split('/').at(-1) ?? path}
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      label={label}
      columns={columns}
      rows={[...episodes]}
      getRowId={(episode) => episode.episode.toString()}
      height="compact"
    />
  );
};

EpisodeTable.displayName = 'EpisodeTable';

export { EpisodeTable };
