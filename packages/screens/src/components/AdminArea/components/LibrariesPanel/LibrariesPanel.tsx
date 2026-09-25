import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { Icon } from '@ValenceUI/Icon';
import { Info as InfoIcon, MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  FileArrowUp as FileArrowUpFilledIcon,
  Images as ImagesFilledIcon,
  Plus as PlusFilledIcon,
  RefreshCw as RefreshCwFilledIcon,
  RotateCw as RotateCwFilledIcon,
  Settings as SettingsFilledIcon,
} from '@keyline-icons/react/fill';
import { useMemo, useState } from 'react';
import { UploadMediaDialog } from '@ValenceScreens/components/AdminArea/components/UploadMediaDialog/UploadMediaDialog';
import { AdminSetupGuide } from '@ValenceScreens/components/AdminArea/components/AdminSetupGuide/AdminSetupGuide';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { notify } from '@ValenceUI/notify';
import { deleteLibrary } from '@ValenceClient/library/fetchLibrary';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { describeScanResult } from '@ValenceClient/admin/describeScanResult';
import { AddLibraryDialog } from '@ValenceScreens/components/AdminArea/components/AddLibraryDialog/AddLibraryDialog';
import { LibrarySettingsDialog } from '@ValenceScreens/components/AdminArea/components/LibrarySettingsDialog/LibrarySettingsDialog';
import { RunningWorkDialog } from '@ValenceScreens/components/AdminArea/components/RunningWorkDialog/RunningWorkDialog';
import { describeScanKind } from '@ValenceScreens/components/AdminArea/describeScanKind';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibrariesPanelProps } from './LibrariesPanel.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { readingOf } from '@ValenceScreens/components/AdminArea/readingOf';
import { workOf } from '@ValenceScreens/components/AdminArea/workOf';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';

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
 * @param hasCatalogueKey - Whether a metadata catalogue key has been saved, for the setup guide.
 * @param isSetupHidden - Whether the setup guide has been put away, which is also the default, so
 *   that only a page told to offer it does.
 * @param onOpenSettings - Told to open the settings, where the catalogue key goes.
 * @param onHideSetup - Told to put the setup guide away.
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
  hasCatalogueKey = true,
  isSetupHidden = true,
  onOpenSettings,
  onHideSetup,
}: LibrariesPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [settingsLibraryId, setSettingsLibraryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Library | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rereading, setRereading] = useState<Library | null>(null);
  const [watching, setWatching] = useState<Library | null>(null);
  const [uploadingTo, setUploadingTo] = useState<Library | null>(null);

  const watchedWork = watching === null ? [] : workOf(progress, watching.id);

  const isBusy =
    libraries.length === 0 ||
    libraries.some((entry) => readingOf(progress, entry.id) !== undefined);

  const columns = useMemo<DataTableColumn<Library>[]>(
    () => [
      {
        id: 'name',
        header: say('admin.librariesPanel.libraryHeader'),
        accessorFn: (library) => library.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <Badge size="sm">{row.original.flavour ?? row.original.kind}</Badge>
            </span>

            <span className="truncate text-xs text-text-muted" title={row.original.path}>
              {row.original.path}
            </span>
          </span>
        ),
      },
      {
        id: 'items',
        header: say('admin.librariesPanel.itemsHeader'),
        accessorFn: (library) => library.itemCount,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            <AnimatedNumber
              value={row.original.itemCount}
              suffix={sayCount('admin.librariesPanel.itemSuffix', row.original.itemCount)}
            />
          </span>
        ),
      },
      {
        id: 'scanned',
        header: say('admin.librariesPanel.lastReadHeader'),
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
        header: say('admin.librariesPanel.stateHeader'),
        enableSorting: false,
        cell: ({ row }) => {
          const busy = workOf(progress, row.original.id);

          if (busy.length === 0) {
            return (
              <Badge size="sm" tone="accent">
                {say('admin.librariesPanel.idle')}
              </Badge>
            );
          }

          return (
            <span className="flex items-center gap-1.5">
              <Badge size="sm" tone={STATUS_LOOK.working.tone}>
                {readingOf(progress, row.original.id) === undefined
                  ? STATUS_LOOK.working.label
                  : say('admin.librariesPanel.reading')}
              </Badge>

              <Button
                variant="subtle"
                size="none"
                isIconOnly
                label={say('admin.librariesPanel.whatItIsDoing', { name: row.original.name })}
                onClick={() => {
                  setWatching(row.original);
                }}
              >
                <Icon of={InfoIcon} size={15} />
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
              label={say('admin.librariesPanel.actionsFor', { name: row.original.name })}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'scan',
                      label: say('admin.librariesPanel.scanForChanges'),
                      icon: <Icon of={RefreshCwFilledIcon} size={15} />,
                      isDisabled: readingOf(progress, row.original.id) !== undefined,
                      onChoose: () => {
                        onScan(row.original.id);
                      },
                    },
                    {
                      id: 'upload',
                      label: say('admin.librariesPanel.uploadMedia'),
                      icon: <Icon of={FileArrowUpFilledIcon} size={15} />,
                      onChoose: () => {
                        setUploadingTo(row.original);
                      },
                    },
                    {
                      id: 'reread',
                      label: say('admin.librariesPanel.rereadMenu'),
                      icon: <Icon of={RotateCwFilledIcon} size={15} />,
                      isDisabled: readingOf(progress, row.original.id) !== undefined,
                      onChoose: () => {
                        setRereading(row.original);
                      },
                    },
                    ...(row.original.kind === 'movies' || row.original.kind === 'shows'
                      ? [
                          {
                            id: 'previews',
                            label: say('admin.librariesPanel.generatePreviews'),
                            icon: <Icon of={ImagesFilledIcon} size={15} />,
                            isDisabled: readingOf(progress, row.original.id) !== undefined,
                            onChoose: () => {
                              onRegeneratePreviews(row.original.id);
                            },
                          },
                        ]
                      : []),
                  ],
                },
                {
                  items: [
                    {
                      id: 'settings',
                      label: say('admin.librariesPanel.librarySettings'),
                      icon: <Icon of={SettingsFilledIcon} size={15} />,
                      onChoose: () => {
                        setSettingsLibraryId(row.original.id);
                      },
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'delete',
                      label: say('admin.librariesPanel.deleteLibraryMenu'),
                      icon: <Icon of={BinFilledIcon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        setDeleting(row.original);
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
    [onScan, onRegeneratePreviews, progress],
  );

  return (
    <PanelCard
      title={say('admin.librariesPanel.heading')}
      isFlush
      actions={
        <ActionMenu
          label={say('admin.librariesPanel.panelActions')}
          trigger={<Icon of={MoreHorizontalIcon} size={18} />}
          groups={[
            {
              items: [
                {
                  id: 'scanAll',
                  label: isScanningAll
                    ? say('admin.librariesPanel.scanningAll')
                    : say('admin.librariesPanel.scanAll'),
                  icon: <Icon of={RotateCwFilledIcon} size={15} />,
                  isDisabled: isBusy || isScanningAll,
                  onChoose: onScanAll,
                },
                {
                  id: 'resetAll',
                  label: isResettingAll
                    ? say('admin.librariesPanel.resetting')
                    : say('admin.librariesPanel.resetMenu'),
                  icon: <Icon of={BinFilledIcon} size={15} />,
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
                  label: say('admin.librariesPanel.addLibrary'),
                  icon: <Icon of={PlusFilledIcon} size={15} />,
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
        <p className="p-6 text-sm text-text-muted">{say('admin.librariesPanel.unreachable')}</p>
      ) : (
        <>
          {isSetupHidden || onOpenSettings === undefined || onHideSetup === undefined ? null : (
            <div className="p-3">
              <AdminSetupGuide
                hasLibrary={libraries.length > 0}
                hasCatalogueKey={hasCatalogueKey}
                hasScanned={libraries.some((library) => library.lastScannedAt !== null)}
                isScanning={isScanningAll}
                onAddLibrary={() => {
                  setIsAdding(true);
                }}
                onOpenSettings={onOpenSettings}
                onScanAll={onScanAll}
                onHide={onHideSetup}
              />
            </div>
          )}

          {libraries.length === 0 ? (
            <p className="p-6 text-sm text-text-muted">{say('admin.librariesPanel.empty')}</p>
          ) : (
            <DataTable
              label={say('admin.librariesPanel.tableLabel')}
              columns={columns}
              rows={libraries}
            />
          )}
        </>
      )}

      <RunningWorkDialog
        title={watching?.name ?? ''}
        isOpen={watching !== null && watchedWork.length > 0}
        progress={watchedWork.map((entry) => ({
          label: describeScanKind(entry.kind, watching?.name ?? ''),
          phase: entry.phase,
          processed: entry.processed,
          total: entry.total,
          item: entry.item,
          isStopping: entry.isStopping,
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
        title={
          deleting === null
            ? say('admin.librariesPanel.deleteFallback')
            : say('admin.librariesPanel.deleteTitle', { name: deleting.name })
        }
        detail={say('admin.librariesPanel.deleteDetail')}
        confirmLabel={say('admin.librariesPanel.deleteConfirm')}
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
              tellOutcome(say('admin.librariesPanel.deleted', { name: doomed.name }), null);
              onLibraryDeleted(doomed.id);
            })
            .catch(() => {
              notify.failed(say('admin.librariesPanel.couldNotDelete', { name: doomed.name }));
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
            ? say('admin.librariesPanel.rereadFallback')
            : say('admin.librariesPanel.rereadTitle', { name: rereading.name })
        }
        detail={say('admin.librariesPanel.rereadDetail')}
        confirmLabel={say('admin.librariesPanel.rereadConfirm')}
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

      <ConfirmDialog
        title={say('admin.librariesPanel.resetTitle')}
        detail={say('admin.librariesPanel.resetDetail')}
        confirmLabel={say('admin.librariesPanel.resetConfirm')}
        isDestructive
        isBusy={isResettingAll}
        isOpen={isConfirmingReset}
        onClose={() => {
          setIsConfirmingReset(false);
        }}
        onConfirm={() => {
          setIsConfirmingReset(false);
          onResetAll();
        }}
      />

      <UploadMediaDialog
        library={uploadingTo}
        onClose={() => {
          setUploadingTo(null);
        }}
        onUploaded={(uploaded) => {
          onScan(uploaded.id);
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
