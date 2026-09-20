import { Icon } from '@ValenceUI/Icon';
import {
  Add01Icon,
  Delete02Icon,
  Image02Icon,
  InformationCircleIcon,
  MoreHorizontalIcon,
  RefreshIcon,
  ReloadIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import { useMemo, useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { notify } from '@ValenceUI/notify';
import { deleteLibrary } from '@ValenceClient/library/fetchLibrary';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { describeScanResult } from '@ValenceClient/admin/describeScanResult';
import { AddLibraryDialog } from '@ValenceScreens/components/AdminArea/components/AddLibraryDialog/AddLibraryDialog';
import { LibrarySettingsDialog } from '@ValenceScreens/components/AdminArea/components/LibrarySettingsDialog/LibrarySettingsDialog';
import { ResetLibrariesDialog } from '@ValenceScreens/components/AdminArea/components/ResetLibrariesDialog/ResetLibrariesDialog';
import { RunningWorkDialog } from '@ValenceScreens/components/AdminArea/components/RunningWorkDialog/RunningWorkDialog';
import { describeScanKind } from '@ValenceScreens/components/AdminArea/describeScanKind';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibrariesPanelProps } from './LibrariesPanel.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { readingOf } from '@ValenceScreens/components/AdminArea/readingOf';
import { workOf } from '@ValenceScreens/components/AdminArea/workOf';
import { STATUS_LOOK } from '@ValenceScreens/status/STATUS_LOOK';

/**
 * The folders Valence reads and what it is doing to them: adding one, scanning one or all of them,
 * rebuilding from nothing, regenerating previews, and each library's own settings. Progress is shown
 * against the library it belongs to rather than in one list, since which library is being worked on
 * is usually the thing worth knowing.
 *
 * @param isUnreachable - Whether the service is not answering.
 * @param libraries - The libraries configured.
 * @param progress - What is running now, by library.
 * @param working - What the queue is working on, for showing what a library's work is made of.
 * @param isScanningAll - Whether a scan of every library is under way.
 * @param isResettingAll - Whether a rebuild of every library is under way.
 * @param onScan - Called with the library to scan, and whether to re-probe every file.
 * @param onScanAll - Called to scan every library.
 * @param onResetAll - Called to rebuild every library from nothing.
 * @param onRegeneratePreviews - Called with the library whose previews are to be remade.
 * @param onLibraryCreated - Called with a library that has just been added.
 * @param onLibraryUpdated - Called with a library whose settings have changed.
 * @param onLibraryDeleted - Told a library has been deleted, so the list can let it go.
 */
const LibrariesPanel = ({
  isUnreachable = false,
  libraries,
  profiles = [],
  progress,
  working,
  isScanningAll,
  isResettingAll,
  onScan,
  onScanAll,
  onResetAll,
  onRegeneratePreviews,
  onLibraryCreated,
  onLibraryUpdated,
  onLibraryDeleted,
}: LibrariesPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [settingsLibraryId, setSettingsLibraryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Library | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rereading, setRereading] = useState<Library | null>(null);
  const [watching, setWatching] = useState<Library | null>(null);

  const watchedWork = watching === null ? [] : workOf(progress, watching.id);

  const isBusy =
    libraries.length === 0 ||
    libraries.some((entry) => readingOf(progress, entry.id) !== undefined);

  const live = useRef({
    progress,
    onScan,
    onRegeneratePreviews,
    setSettingsLibraryId,
    setDeleting,
    setRereading,
    setWatching,
  });

  live.current = {
    progress,
    onScan,
    onRegeneratePreviews,
    setSettingsLibraryId,
    setDeleting,
    setRereading,
    setWatching,
  };

  const columns = useMemo<DataTableColumn<Library>[]>(
    () => [
      {
        id: 'name',
        header: 'Library',
        accessorFn: (library) => library.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <Badge size="sm">{row.original.kind}</Badge>
            </span>

            <span className="truncate text-xs text-text-muted" title={row.original.path}>
              {row.original.path}
            </span>
          </span>
        ),
      },
      {
        id: 'items',
        header: 'Items',
        accessorFn: (library) => library.itemCount,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.itemCount === 1 ? '1 item' : `${row.original.itemCount.toString()} items`}
          </span>
        ),
      },
      {
        id: 'scanned',
        header: 'Last read',
        accessorFn: (library) => library.lastScannedAt ?? '',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="whitespace-nowrap text-xs text-text-muted">
              {describeSince(row.original.lastScannedAt, Date.now())}
            </span>

            {row.original.lastScan === undefined ? null : (
              <span
                className={cn(
                  'whitespace-nowrap text-xs',
                  row.original.lastScan.removed === 0 ? 'text-text-muted' : 'text-danger',
                )}
              >
                {describeScanResult(row.original.lastScan)}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'state',
        header: 'State',
        enableSorting: false,
        cell: ({ row }) => {
          const busy = workOf(live.current.progress, row.original.id);

          if (busy.length === 0) {
            return (
              <Badge size="sm" tone="accent">
                Idle
              </Badge>
            );
          }

          return (
            <span className="flex items-center gap-1.5">
              <Badge size="sm" tone={STATUS_LOOK.working.tone}>
                {readingOf(live.current.progress, row.original.id) === undefined
                  ? STATUS_LOOK.working.label
                  : 'Reading'}
              </Badge>

              <Button
                variant="bare"
                size="none"
                isIconOnly
                label={`What ${row.original.name} is doing`}
                className="text-text-muted hover:text-text"
                onClick={() => {
                  live.current.setWatching(row.original);
                }}
              >
                <Icon of={InformationCircleIcon} size={15} />
              </Button>
            </span>
          );
        },
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={`Actions for ${row.original.name}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'scan',
                      label: 'Scan for changes',
                      icon: <Icon of={RefreshIcon} size={15} />,
                      isDisabled: readingOf(live.current.progress, row.original.id) !== undefined,
                      onChoose: () => {
                        live.current.onScan(row.original.id);
                      },
                    },
                    {
                      id: 'reread',
                      label: 'Read every file again',
                      icon: <Icon of={ReloadIcon} size={15} />,
                      isDisabled: readingOf(live.current.progress, row.original.id) !== undefined,
                      onChoose: () => {
                        live.current.setRereading(row.original);
                      },
                    },
                    {
                      id: 'previews',
                      label: 'Generate missing previews',
                      icon: <Icon of={Image02Icon} size={15} />,
                      isDisabled: readingOf(live.current.progress, row.original.id) !== undefined,
                      onChoose: () => {
                        live.current.onRegeneratePreviews(row.original.id);
                      },
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'settings',
                      label: 'Library settings',
                      icon: <Icon of={Settings02Icon} size={15} />,
                      onChoose: () => {
                        live.current.setSettingsLibraryId(row.original.id);
                      },
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'delete',
                      label: 'Delete library',
                      icon: <Icon of={Delete02Icon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        live.current.setDeleting(row.original);
                      },
                    },
                  ],
                },
              ]}
            />
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <PanelCard
      title="Libraries"
      isFlush
      actions={
        <ActionMenu
          label="Library actions"
          trigger={<Icon of={MoreHorizontalIcon} size={18} />}
          groups={[
            {
              items: [
                {
                  id: 'scanAll',
                  label: isScanningAll ? 'Scanning all libraries…' : 'Scan all libraries',
                  icon: <Icon of={ReloadIcon} size={15} />,
                  isDisabled: isBusy || isScanningAll,
                  onChoose: onScanAll,
                },
                {
                  id: 'resetAll',
                  label: isResettingAll ? 'Resetting and rebuilding…' : 'Reset and rebuild',
                  icon: <Icon of={Delete02Icon} size={15} />,
                  isDestructive: true,
                  isDisabled: isBusy || isResettingAll,
                  onChoose: () => {
                    setIsConfirmingReset(true);
                  },
                },
              ],
            },
            {
              items: [
                {
                  id: 'add',
                  label: 'Add library',
                  icon: <Icon of={Add01Icon} size={15} />,
                  onChoose: () => {
                    setIsAdding(true);
                  },
                },
              ],
            },
          ]}
        />
      }
    >
      {isUnreachable ? (
        <p className="p-6 text-sm text-text-muted">
          The libraries could not be read from the server. This is not the same as having none — do
          not add one until it answers again.
        </p>
      ) : libraries.length === 0 ? (
        <p className="p-6 text-sm text-text-muted">
          No libraries yet. Add one pointing at a folder of media.
        </p>
      ) : (
        <DataTable label="Library roots" columns={columns} rows={libraries} />
      )}

      <RunningWorkDialog
        title={watching?.name ?? ''}
        isOpen={watching !== null && watchedWork.length > 0}
        progress={watchedWork.map((entry) => ({
          label: describeScanKind(entry.kind, watching?.name ?? ''),
          phase: entry.phase,
          processed: entry.processed,
          total: entry.total,
        }))}
        tasks={working.filter(
          (job) =>
            job.correlationId !== null &&
            watchedWork.some((entry) => entry.jobId === job.correlationId),
        )}
        onClose={() => {
          setWatching(null);
        }}
      />

      <ConfirmDialog
        title={deleting === null ? 'Delete this library?' : `Delete ${deleting.name}?`}
        detail="Valence forgets this library and everything it knows about what is in it — watch progress, ratings, favourites, previews and thumbnails. Playlists holding anything from it keep their place and say what they lost. The files on disk are not touched. Anything running for it now is stopped."
        confirmLabel="Delete library"
        isDestructive
        isBusy={isDeleting}
        isOpen={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          const doomed = deleting;

          if (doomed === null) {
            return;
          }

          setIsDeleting(true);

          void deleteLibrary(doomed.id)
            .then(() => {
              onLibraryDeleted(doomed.id);
            })
            .catch(() => {
              notify.failed(`${doomed.name} could not be deleted.`);
            })
            .finally(() => {
              setIsDeleting(false);
              setDeleting(null);
            });
        }}
      />

      <ConfirmDialog
        title={
          rereading === null
            ? 'Read every file again?'
            : `Read every file in ${rereading.name} again?`
        }
        detail="Every file is probed again rather than only the ones that changed. Nothing is deleted, but on a large library it can take a long while and keeps the server busy."
        confirmLabel="Read every file again"
        isOpen={rereading !== null}
        onClose={() => {
          setRereading(null);
        }}
        onConfirm={() => {
          if (rereading === null) {
            return;
          }

          onScan(rereading.id, true);
          setRereading(null);
        }}
      />

      <AddLibraryDialog
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
        }}
        onCreated={(library) => {
          setIsAdding(false);
          onLibraryCreated(library);
        }}
      />

      <ResetLibrariesDialog
        isOpen={isConfirmingReset}
        isResetting={isResettingAll}
        onClose={() => {
          setIsConfirmingReset(false);
        }}
        onConfirm={() => {
          setIsConfirmingReset(false);
          onResetAll();
        }}
      />

      <LibrarySettingsDialog
        key={settingsLibraryId ?? 'none'}
        profiles={profiles}
        library={libraries.find((entry) => entry.id === settingsLibraryId) ?? null}
        isOpen={settingsLibraryId !== null}
        onClose={() => {
          setSettingsLibraryId(null);
        }}
        onUpdated={onLibraryUpdated}
        onRegenerate={onRegeneratePreviews}
      />
    </PanelCard>
  );
};

LibrariesPanel.displayName = 'LibrariesPanel';

export { LibrariesPanel };
