import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Bin as BinIcon,
  Folders as FoldersIcon,
  Info as InfoIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Spinner } from '@ValenceUI/Spinner';
import { Tooltip } from '@ValenceUI/Tooltip';
import { AnimatedBytes } from '@ValenceScreens/components/AnimatedBytes/AnimatedBytes';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { describeDownloadState } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeDownloadState';
import { ReadoutLines } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/components/ReadoutLines/ReadoutLines';
import { speedsOf } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/speedsOf';
import { describeTimeLeft } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeTimeLeft';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { DownloadQueueTableProps } from './DownloadQueueTable.types';

const PAUSABLE = new Set(['queued', 'downloading', 'stalled']);

/**
 * Says how much of a download has arrived, in the size it is going to be.
 *
 * @param download - The download.
 * @returns Such as `2.1 GB of 4.6 GB`, or the size alone before anything has arrived, with the
 *   numbers rolling.
 */
const describeArrived = (download: QueuedDownload): ReactNode => {
  if (download.sizeBytes === null) {
    return download.doneBytes === null ? null : <AnimatedBytes bytes={download.doneBytes} />;
  }

  return download.doneBytes === null || download.state === 'done' ? (
    <AnimatedBytes bytes={download.sizeBytes} />
  ) : (
    <>
      <AnimatedBytes bytes={download.doneBytes} /> of <AnimatedBytes bytes={download.sizeBytes} />
    </>
  );
};

/**
 * Every download Valence has sent, newest first: what it is and where it went, how it is doing, how
 * much has arrived and how fast, how long is left, who it is coming from, and what can be done to
 * it — pausing, resuming and removing.
 *
 * @param downloads - The downloads.
 * @param libraries - The libraries a film or series can be filed into.
 * @param busyId - The download being acted on, whose actions wait until it is done.
 * @param onFile - Called to file a download into a library.
 * @param onPause - Called to pause a download.
 * @param onResume - Called to resume one.
 * @param onRemove - Called to remove one.
 */
const DownloadQueueTable = ({
  downloads,
  libraries,
  busyId,
  onFile,
  onPause,
  onResume,
  onRemove,
}: DownloadQueueTableProps) => {
  const columns = useMemo<DataTableColumn<QueuedDownload>[]>(
    () => [
      {
        id: 'title',
        header: 'Release',
        accessorFn: (download) => download.title,
        cell: ({ row }) => (
          <span className="flex max-w-[32rem] min-w-0 flex-col gap-0.5">
            <Tooltip label={row.original.title}>
              <span className="truncate font-medium text-text">{row.original.title}</span>
            </Tooltip>

            <span className="truncate text-xs text-text-muted">
              {[
                LIBRARY_KIND_NAMES[row.original.libraryKind].label,
                row.original.clientName,
                row.original.indexerName,
              ]
                .filter((part) => part !== null)
                .join(' · ')}
            </span>
          </span>
        ),
      },
      {
        id: 'state',
        header: 'State',
        accessorFn: (download) => describeDownloadState(download).label,
        cell: ({ row }) => {
          const state = describeDownloadState(row.original);

          return (
            <span className="flex items-center gap-1.5">
              <Badge size="sm" tone={state.tone}>
                {row.original.state === 'downloading' ? (
                  <Spinner size="xs" label={`Downloading ${row.original.title}`} />
                ) : null}
                {state.label}
              </Badge>

              {state.detail === null ? null : (
                <HoverCard
                  side="bottom"
                  align="start"
                  detail={<span className="break-words text-text-muted">{state.detail}</span>}
                >
                  <span className="text-text-muted hover:text-text">
                    <Icon of={InfoIcon} size={14} label={state.detail} />
                  </span>
                </HoverCard>
              )}
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: 'Progress',
        accessorFn: (download) => download.progress,
        cell: ({ row }) => {
          const arrived = describeArrived(row.original);

          return (
            <span className="flex flex-col gap-1">
              <ProgressBar
                label={`How much of ${row.original.title} has arrived`}
                value={Math.round(row.original.progress * 1000) / 10}
                readout={
                  <AnimatedNumber
                    value={Math.floor(row.original.progress * 100)}
                    suffix="%"
                    className="text-xs text-text"
                  />
                }
              />

              {arrived === null ? null : (
                <span className="text-xs tabular-nums text-text-muted">{arrived}</span>
              )}
            </span>
          );
        },
      },
      {
        id: 'speed',
        header: 'Speed',
        accessorFn: (download) => download.downloadBytesPerSecond ?? -1,
        cell: ({ row }) => (
          <ReadoutLines
            lines={speedsOf(row.original.downloadBytesPerSecond, row.original.uploadBytesPerSecond)}
          />
        ),
      },
      {
        id: 'left',
        header: 'Time left',
        accessorFn: (download) => download.secondsLeft ?? Number.MAX_SAFE_INTEGER,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-text-muted">
            {row.original.secondsLeft === null ? '—' : describeTimeLeft(row.original.secondsLeft)}
          </span>
        ),
      },
      {
        id: 'peers',
        header: 'Peers',
        accessorFn: (download) => download.seeds ?? -1,
        cell: ({ row }) => (
          <ReadoutLines
            lines={
              row.original.seeds === null && row.original.peers === null
                ? []
                : [
                    <AnimatedNumber
                      key="seeding"
                      value={row.original.seeds ?? 0}
                      suffix=" seeding"
                    />,
                    <AnimatedNumber
                      key="fetching"
                      value={row.original.peers ?? 0}
                      suffix=" fetching"
                    />,
                  ]
            }
          />
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          busyId === row.original.id ? (
            <span className="flex justify-end">
              <Spinner size="sm" label={`Working on ${row.original.title}`} />
            </span>
          ) : (
            <span className="flex justify-end">
              <ActionMenu
                label={`Actions for ${row.original.title}`}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      ...(PAUSABLE.has(row.original.state)
                        ? [
                            {
                              id: 'pause',
                              label: 'Pause',
                              icon: <Icon of={PauseFilledIcon} size={15} />,
                              onChoose: () => {
                                onPause(row.original);
                              },
                            },
                          ]
                        : []),
                      ...(row.original.state === 'paused'
                        ? [
                            {
                              id: 'resume',
                              label: 'Resume',
                              icon: <Icon of={PlayFilledIcon} size={15} />,
                              onChoose: () => {
                                onResume(row.original);
                              },
                            },
                          ]
                        : []),
                      {
                        id: 'remove',
                        label: 'Remove',
                        icon: <Icon of={BinIcon} size={15} />,
                        isDestructive: true,
                        onChoose: () => {
                          onRemove(row.original);
                        },
                      },
                    ],
                  },
                  {
                    items: libraries
                      .filter(
                        (library) =>
                          library.kind === row.original.libraryKind &&
                          (library.kind === 'movies' || library.kind === 'shows'),
                      )
                      .map((library) => ({
                        id: `file-${library.id}`,
                        label: `File into ${library.name}`,
                        hint:
                          row.original.state !== 'done'
                            ? 'Once it has downloaded.'
                            : row.original.filedInto === null
                              ? 'Now, named from the release.'
                              : 'Again, beside what was filed before.',
                        icon: <Icon of={FoldersIcon} size={15} />,
                        onChoose: () => {
                          onFile(row.original, library.id);
                        },
                      })),
                  },
                ]}
              />
            </span>
          ),
      },
    ],
    [busyId, libraries, onFile, onPause, onResume, onRemove],
  );

  return (
    <DataTable
      label="Downloads"
      columns={columns}
      rows={[...downloads]}
      getRowId={(download) => download.id}
      emptyMessage="Nothing has been sent to a download client yet. Send a release from Search to see it here."
    />
  );
};

DownloadQueueTable.displayName = 'DownloadQueueTable';

export { DownloadQueueTable };
