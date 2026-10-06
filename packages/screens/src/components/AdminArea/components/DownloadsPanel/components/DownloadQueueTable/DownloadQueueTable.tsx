import { useMemo } from 'react';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import type { ReactNode } from 'react';
import {
  Bin as BinFilledIcon,
  Folders as FoldersFilledIcon,
  Info as InfoIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pause as PauseFilledIcon,
  Play as PlayFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Checkbox } from '@ValenceUI/Checkbox';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Spinner } from '@ValenceUI/Spinner';
import { Tooltip } from '@ValenceUI/Tooltip';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { describeDownloadState } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeDownloadState';
import { ReadoutLines } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/components/ReadoutLines/ReadoutLines';
import { PAUSABLE_STATES } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/PAUSABLE_STATES';
import { speedsOf } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/speedsOf';
import { describeTimeLeft } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeTimeLeft';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { DownloadQueueTableProps } from './DownloadQueueTable.types';
import { say } from '@ValenceI18n/say';

/**
 * Says how much of a download has arrived, in the size it is going to be.
 *
 * @param download - The download.
 * @returns Such as `2.1 GB of 4.6 GB`, or the size alone before anything has arrived, with the
 *   numbers rolling.
 */
const describeArrived = (download: QueuedDownload): ReactNode => {
  if (download.sizeBytes === null) {
    return download.doneBytes === null ? null : <FormattedBytes bytes={download.doneBytes} />;
  }

  return download.doneBytes === null || download.state === 'done' ? (
    <FormattedBytes bytes={download.sizeBytes} />
  ) : (
    <Sentence
      words="screens.downloadsPanel.downloadQueueTable.doneOfSize"
      fillings={{
        done: <FormattedBytes bytes={download.doneBytes} />,
        size: <FormattedBytes bytes={download.sizeBytes} />,
      }}
    />
  );
};

/**
 * Every download Valence has sent, newest first: what it is and where it went, how it is doing, how
 * much has arrived and how fast, how long is left, who it is coming from, and what can be done to
 * it — pausing, resuming and removing, one at a time or, where they can be ticked, several at once.
 *
 * @param downloads - The downloads.
 * @param libraries - The libraries a film or series can be filed into.
 * @param busyId - The download being acted on, whose actions wait until it is done.
 * @param busyIds - Several being acted on at once, where a choice of them is.
 * @param chosen - The downloads ticked, where several can be chosen to act on together.
 * @param onChosenChange - Told which are ticked now; without it, nothing can be ticked.
 * @param toolbar - What sits above the table, such as what to do to the ones ticked.
 * @param onFile - Called to file a download into a library.
 * @param onPause - Called to pause a download.
 * @param onResume - Called to resume one.
 * @param onRemove - Called to remove one.
 * @param fillsScreen - Whether it stands as tall as the room left below it, on a page that is
 *   otherwise this table, rather than a modest height inside a dialog.
 */
const DownloadQueueTable = ({
  downloads,
  libraries,
  busyId,
  busyIds,
  chosen,
  onChosenChange,
  toolbar,
  onFile,
  onPause,
  onResume,
  onRemove,
  fillsScreen = false,
}: DownloadQueueTableProps) => {
  const columns = useMemo<DataTableColumn<QueuedDownload>[]>(
    () => [
      ...(onChosenChange === undefined
        ? []
        : [
            {
              id: 'chosen',
              header: () => (
                <Checkbox
                  label={say('screens.downloadsPanel.downloadQueueTable.chooseEveryDownload')}
                  isLabelHidden
                  checked={downloads.length > 0 && (chosen?.size ?? 0) === downloads.length}
                  isMixed={(chosen?.size ?? 0) > 0 && (chosen?.size ?? 0) < downloads.length}
                  onCheckedChange={(isChosen) => {
                    onChosenChange(
                      isChosen ? new Set(downloads.map((download) => download.id)) : new Set(),
                    );
                  }}
                />
              ),
              enableSorting: false,
              meta: { shrinks: true },
              cell: ({ row }: { row: { original: QueuedDownload } }) => (
                <Checkbox
                  label={say('screens.downloadsPanel.downloadQueueTable.chooseTitle', {
                    title: row.original.title,
                  })}
                  isLabelHidden
                  checked={chosen?.has(row.original.id) === true}
                  onCheckedChange={(isChosen) => {
                    const next = new Set(chosen);

                    if (isChosen) {
                      next.add(row.original.id);
                    } else {
                      next.delete(row.original.id);
                    }

                    onChosenChange(next);
                  }}
                />
              ),
            } satisfies DataTableColumn<QueuedDownload>,
          ]),
      {
        id: 'title',
        header: say('common.release'),
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
        header: say('common.state'),
        accessorFn: (download) => describeDownloadState(download).label,
        cell: ({ row }) => {
          const state = describeDownloadState(row.original);

          return (
            <span className="flex items-center gap-1.5">
              <Badge size="sm" tone={state.tone}>
                {state.label}
              </Badge>

              {state.detail === null ? null : (
                <HoverCard
                  side="bottom"
                  align="start"
                  detail={
                    <span className="flex flex-col items-start gap-1">
                      <span className="break-words text-text-muted">{state.detail}</span>
                      <HowToFix href={state.help} />
                    </span>
                  }
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
        header: say('common.progress'),
        accessorFn: (download) => download.progress,
        cell: ({ row }) => {
          const arrived = describeArrived(row.original);

          return (
            <span className="flex flex-col gap-1">
              <ProgressBar
                label={say('common.howFarTitleHasDownloaded', { title: row.original.title })}
                value={Math.round(row.original.progress * 1000) / 10}
                readout={
                  <FormattedNumber
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
        header: say('common.speed'),
        accessorFn: (download) => download.downloadBytesPerSecond ?? -1,
        cell: ({ row }) => (
          <ReadoutLines
            lines={speedsOf(row.original.downloadBytesPerSecond, row.original.uploadBytesPerSecond)}
          />
        ),
      },
      {
        id: 'left',
        header: say('common.timeLeft'),
        accessorFn: (download) => download.secondsLeft ?? Number.MAX_SAFE_INTEGER,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-text-muted">
            {row.original.secondsLeft === null ? '—' : describeTimeLeft(row.original.secondsLeft)}
          </span>
        ),
      },
      {
        id: 'peers',
        header: say('common.peers'),
        accessorFn: (download) => download.seeds ?? -1,
        cell: ({ row }) => (
          <ReadoutLines
            lines={
              row.original.seeds === null && row.original.peers === null
                ? []
                : [
                    <FormattedNumber
                      key="seeding"
                      value={row.original.seeds ?? 0}
                      suffix=" seeding"
                    />,
                    <FormattedNumber
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
          busyId === row.original.id || busyIds?.has(row.original.id) === true ? (
            <span className="flex justify-end">
              <Spinner
                size="sm"
                label={say('common.workingOnTitle', { title: row.original.title })}
              />
            </span>
          ) : (
            <span className="flex justify-end">
              <ActionMenu
                label={say('common.actionsForTitle', { title: row.original.title })}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      ...(PAUSABLE_STATES.has(row.original.state)
                        ? [
                            {
                              id: 'pause',
                              label: say('common.pause'),
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
                              label: say('common.resume'),
                              icon: <Icon of={PlayFilledIcon} size={15} />,
                              onChoose: () => {
                                onResume(row.original);
                              },
                            },
                          ]
                        : []),
                      {
                        id: 'remove',
                        label: say('common.forget'),
                        icon: <Icon of={BinFilledIcon} size={15} />,
                        isDestructive: true,
                        onChoose: () => {
                          onRemove(row.original);
                        },
                      },
                    ],
                  },
                  {
                    items: libraries
                      .filter((library) => library.kind === row.original.libraryKind)
                      .map((library) => ({
                        id: `file-${library.id}`,
                        label: say('screens.downloadsPanel.downloadQueueTable.fileIntoName', {
                          name: library.name,
                        }),
                        hint:
                          row.original.state !== 'done'
                            ? say('screens.downloadsPanel.downloadQueueTable.onceItHasDownloaded')
                            : row.original.filedInto === null
                              ? say(
                                  'screens.downloadsPanel.downloadQueueTable.nowNamedFromTheRelease',
                                )
                              : say(
                                  'screens.downloadsPanel.downloadQueueTable.againBesideWhatWasFiledBefore',
                                ),
                        icon: <Icon of={FoldersFilledIcon} size={15} />,
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
    [
      busyId,
      busyIds,
      chosen,
      downloads,
      libraries,
      onChosenChange,
      onFile,
      onPause,
      onResume,
      onRemove,
    ],
  );

  return (
    <DataTable
      height={fillsScreen ? 'fills' : 'compact'}
      label={say('common.downloads')}
      columns={columns}
      rows={[...downloads]}
      getRowId={(download) => download.id}
      {...(toolbar === undefined ? {} : { toolbar })}
      emptyMessage={say('screens.downloadsPanel.downloadQueueTable.nothingHasBeenSentToA')}
    />
  );
};

DownloadQueueTable.displayName = 'DownloadQueueTable';

export { DownloadQueueTable };
