import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Copy01Icon,
  LinkSquare02Icon,
  Magnet01Icon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeAge } from '@ValenceCore/functions/describeAge';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { inReleaseOrder } from './inReleaseOrder';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { IndexerSearchMode, Release, ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

const MODES: readonly { id: IndexerSearchMode; label: string }[] = [
  { id: 'search', label: 'Anything' },
  { id: 'movie', label: 'Films' },
  { id: 'tv', label: 'Series' },
  { id: 'music', label: 'Music' },
  { id: 'book', label: 'Books' },
];

/**
 * Reads a season or episode number typed into the form.
 *
 * @param text - What was typed.
 * @returns The number, or nothing where none was typed.
 */
const numbered = (text: string): number | undefined => {
  const value = Number.parseInt(text, 10);

  return Number.isInteger(value) && value >= 0 ? value : undefined;
};

/**
 * Searching every indexer by hand, the way Prowlarr's search page does: a few words and what kind
 * of thing they name, and every release the indexers found, most widely shared first, with where
 * each came from and a way to fetch it.
 *
 * A search is asked once and kept for as long as the page is open, so going back to one does not
 * ask every indexer again. Each indexer's own answer is shown above the results, so one that
 * failed or timed out says so rather than simply finding nothing.
 */
const ReleaseSearchPanel = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<IndexerSearchMode>('search');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const [asked, setAsked] = useState<ReleaseSearch | null>(null);
  const found = useQuery(requestsQueries.search(asked));
  const now = found.dataUpdatedAt;

  const columns = useMemo<DataTableColumn<Release>[]>(
    () => [
      {
        id: 'title',
        header: 'Release',
        accessorFn: (release) => release.title,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="break-all text-sm text-text">{row.original.title}</span>

            <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              {row.original.indexerName}
              <Badge size="sm">{row.original.protocol === 'torrent' ? 'Torrent' : 'Usenet'}</Badge>
            </span>
          </span>
        ),
      },
      {
        id: 'size',
        header: 'Size',
        accessorFn: (release) => release.sizeBytes ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'peers',
        header: 'Peers',
        accessorFn: (release) => release.seeders ?? release.grabs ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text">
            {row.original.protocol === 'usenet'
              ? row.original.grabs === null
                ? '—'
                : `${row.original.grabs.toString()} grabs`
              : `${row.original.seeders?.toString() ?? '?'} / ${row.original.leechers?.toString() ?? '?'}`}
          </span>
        ),
      },
      {
        id: 'age',
        header: 'Age',
        accessorFn: (release) =>
          release.publishedAt === null ? 0 : Date.parse(release.publishedAt),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-text-muted">
            {row.original.publishedAt === null
              ? '—'
              : (describeAge(row.original.publishedAt, now) ?? '—')}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const { magnetUrl, downloadUrl, infoUrl, title } = row.original;

          return (
            <span className="flex justify-end">
              <ActionMenu
                label={`Actions for ${title}`}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      {
                        id: 'magnet',
                        label: 'Copy the magnet link',
                        icon: <Icon of={Magnet01Icon} size={15} />,
                        isDisabled: magnetUrl === null,
                        onChoose: () => {
                          void navigator.clipboard.writeText(magnetUrl ?? '');
                        },
                      },
                      {
                        id: 'download',
                        label: 'Copy the download link',
                        icon: <Icon of={Copy01Icon} size={15} />,
                        isDisabled: downloadUrl === null,
                        onChoose: () => {
                          void navigator.clipboard.writeText(downloadUrl ?? '');
                        },
                      },
                      {
                        id: 'page',
                        label: 'Open its page',
                        icon: <Icon of={LinkSquare02Icon} size={15} />,
                        isDisabled: infoUrl === null,
                        onChoose: () => {
                          window.open(infoUrl ?? '', '_blank', 'noopener,noreferrer');
                        },
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
    [now],
  );

  const search = () => {
    const words = query.trim();
    const isSeries = mode === 'tv';
    const seasonNumber = isSeries ? numbered(season) : undefined;
    const episodeNumber = isSeries ? numbered(episode) : undefined;

    if (words === '') {
      return;
    }

    setAsked({
      query: words,
      mode,
      ...(seasonNumber === undefined ? {} : { season: seasonNumber }),
      ...(episodeNumber === undefined ? {} : { episode: episodeNumber }),
    });
  };

  const releases = useMemo(() => inReleaseOrder(found.data?.releases ?? []), [found.data]);

  return (
    <PanelCard title="Search" isFlush>
      <form
        className="flex flex-col gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label="Search for"
            type="search"
            value={query}
            onValueChange={setQuery}
            placeholder="Dune Part Two 2160p"
            className="min-w-0 flex-1"
          />

          {mode !== 'tv' ? null : (
            <>
              <TextField
                label="Season"
                type="number"
                min={0}
                value={season}
                onValueChange={setSeason}
                className="w-24"
              />

              <TextField
                label="Episode"
                type="number"
                min={0}
                value={episode}
                onValueChange={setEpisode}
                className="w-24"
              />
            </>
          )}

          <Button type="submit" variant="glossy" disabled={query.trim() === '' || found.isFetching}>
            Search
          </Button>
        </div>

        <SegmentedRow
          label="What it is"
          size="sm"
          items={MODES}
          value={mode}
          onSelect={(next) => {
            const chosen = MODES.find((one) => one.id === next)?.id;

            if (chosen !== undefined) {
              setMode(chosen);
            }
          }}
        />
      </form>

      {asked === null ? (
        <p className="px-4 pb-6 text-sm text-text-muted">
          Search every enabled indexer at once. What each finds is listed together, most widely
          shared first.
        </p>
      ) : found.isError ? (
        <CouldNotRead
          what="The search"
          isTryingAgain={found.isFetching}
          onTryAgain={() => {
            void found.refetch();
          }}
        />
      ) : found.isPending ? (
        <div className="p-4">
          <Spinner label="Asking every indexer" size="sm" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ul aria-label="What each indexer said" className="flex flex-wrap gap-2 px-4">
            {found.data.indexers.map((report) => (
              <li key={report.indexerId}>
                <Badge size="sm" tone={report.problem === null ? 'quiet' : 'danger'}>
                  {report.problem === null
                    ? `${report.indexerName}: ${report.found.toString()} in ${(report.tookMs / 1000).toFixed(1)}s`
                    : `${report.indexerName}: ${report.problem}`}
                </Badge>
              </li>
            ))}
          </ul>

          <DataTable
            label="Releases found"
            columns={columns}
            rows={releases}
            getRowId={(release) => release.id}
            emptyMessage={
              found.data.indexers.length === 0
                ? 'No indexer is switched on, so there was nothing to search.'
                : 'Nothing was found. Try fewer words, or another kind.'
            }
          />
        </div>
      )}
    </PanelCard>
  );
};

ReleaseSearchPanel.displayName = 'ReleaseSearchPanel';

export { ReleaseSearchPanel };
