import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive as ArchiveFilledIcon,
  Bin as BinFilledIcon,
  Calendar as CalendarFilledIcon,
  Download as DownloadFilledIcon,
  History as HistoryFilledIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Callout } from '@ValenceUI/Callout';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { Tooltip } from '@ValenceUI/Tooltip';
import { rowActionsColumn } from '@ValenceUI/DataTable/rowActionsColumn';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { backupAddress, removeBackup, takeBackup } from '@ValenceClient/admin/fetchBackups';
import type { Backup, BackupKind } from '@ValenceContracts/schemas/Backup';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { notify } from '@ValenceUI/notify';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';
import { RestoreBackupDialog } from './components/RestoreBackupDialog/RestoreBackupDialog';
import type { BackupsPanelProps } from './BackupsPanel.types';

const KIND_NAMES: Readonly<Record<BackupKind, string>> = {
  beforeUpgrade: say('screens.adminArea.backupsPanel.beforeAnUpgrade'),
  byHand: say('screens.adminArea.backupsPanel.byHand'),
  onSchedule: say('screens.adminArea.backupsPanel.onTheSchedule'),
};

/**
 * Copies of the whole database — every account, profile, watch history, request, setting and plugin
 * setting — kept in the backup folder: the ones taken before each upgrade, on the weekly schedule,
 * and by hand from here. Each can be downloaded to keep somewhere else, removed, or put back with the
 * commands the restore dialog gives.
 *
 * @param onOpenSchedule - Called to open the schedule the backups are taken on.
 */
const BackupsPanel = ({ onOpenSchedule }: BackupsPanelProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.backups());
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const [isTaking, setIsTaking] = useState(false);
  const [removing, setRemoving] = useState<Backup | null>(null);
  const [restoring, setRestoring] = useState<Backup | null>(null);
  const list = asked.data;

  const reread = () => cache.invalidateQueries({ queryKey: adminQueries.backups().queryKey });

  const takeOne = () => {
    setIsTaking(true);

    void notify
      .during(say('screens.adminArea.backupsPanel.backingUpTheDatabase'), takeBackup(), (answer) =>
        answer.kind === 'refused'
          ? {
              failed:
                answer.refusal?.message ??
                say('screens.adminArea.backupsPanel.theBackupCouldNotBeTaken'),
            }
          : { worked: say('screens.adminArea.backupsPanel.backedUpTheDatabase') },
      )
      .then(reread)
      .finally(() => {
        setIsTaking(false);
      });
  };

  useAdminCommand('takeBackup', takeOne);

  const columns = useMemo<DataTableColumn<Backup>[]>(
    () => [
      {
        id: 'takenAt',
        header: say('screens.adminArea.backupsPanel.taken'),
        accessorFn: (backup) => backup.takenAt,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <Tooltip label={row.original.name}>
              <span className="truncate font-medium text-text">
                {new Date(row.original.takenAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </Tooltip>
            <span className="text-xs text-text-muted">
              {describeSince(row.original.takenAt, now)}
              <span className="sm:hidden"> · {KIND_NAMES[row.original.kind]}</span>
            </span>
          </span>
        ),
      },
      {
        id: 'kind',
        meta: { hidesOnPhones: true },
        header: say('common.why'),
        accessorFn: (backup) => KIND_NAMES[backup.kind],
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col items-start gap-1">
            <Badge size="sm">{KIND_NAMES[row.original.kind]}</Badge>

            {row.original.before === null ? null : (
              <span className="truncate text-xs text-text-muted">{row.original.before}</span>
            )}
          </span>
        ),
      },
      {
        id: 'size',
        header: say('common.size'),
        accessorFn: (backup) => backup.sizeBytes,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            <FormattedBytes bytes={row.original.sizeBytes} />
          </span>
        ),
      },
      rowActionsColumn(
        (backup) => backup.name,
        (backup) => [
          {
            items: [
              {
                id: 'download',
                label: say('common.download'),
                icon: <Icon of={DownloadFilledIcon} size={15} />,
                onChoose: () => {
                  window.location.assign(backupAddress(backup.name));
                },
              },
              {
                id: 'restore',
                label: say('screens.adminArea.backupsPanel.putItBack'),
                icon: <Icon of={HistoryFilledIcon} size={15} />,
                onChoose: () => {
                  setRestoring(backup);
                },
              },
            ],
          },
          {
            items: [
              {
                id: 'remove',
                label: say('common.delete'),
                icon: <Icon of={BinFilledIcon} size={15} />,
                isDestructive: true,
                onChoose: () => {
                  setRemoving(backup);
                },
              },
            ],
          },
        ],
      ),
    ],
    [now],
  );

  return (
    <PanelCard
      title={say('screens.adminArea.adminSections.backups')}
      isFlush
      actions={
        <>
          <PanelCardAction icon={CalendarFilledIcon} onClick={onOpenSchedule}>
            {say('screens.observabilityPage.schedule')}
          </PanelCardAction>
          <PanelCardAction
            icon={ArchiveFilledIcon}
            onClick={takeOne}
            isLoading={isTaking}
            isDisabled={isTaking || list?.isToolInstalled === false}
          >
            {say('screens.adminArea.backupsPanel.backUpNow')}
          </PanelCardAction>
          <PanelCardInfo
            label={say('screens.adminArea.backupsPanel.aboutBackups')}
            detail={
              list === undefined
                ? say('screens.adminArea.backupsPanel.aCopyOfTheWholeDatabase')
                : say('screens.adminArea.backupsPanel.aCopyOfTheWholeDatabaseKeptIn', {
                    folder: list.folder,
                    kept: list.kept.toString(),
                  })
            }
          />
        </>
      }
    >
      <ConfirmDialog
        title={say('screens.adminArea.backupsPanel.deleteThisBackup')}
        detail={say('screens.adminArea.backupsPanel.itIsRemovedFromTheBackupFolder')}
        confirmLabel={say('common.delete')}
        isDestructive
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          const doomed = removing;

          setRemoving(null);

          if (doomed !== null) {
            void removeBackup(doomed.name)
              .then((isRemoved) => {
                tellOutcome(
                  say('screens.adminArea.backupsPanel.deletedTheBackup'),
                  isRemoved
                    ? null
                    : say('screens.adminArea.backupsPanel.theBackupCouldNotBeDeleted'),
                );
              })
              .then(reread);
          }
        }}
      />

      <RestoreBackupDialog
        backup={restoring}
        restoreCommand={list?.restoreCommand ?? ''}
        onClose={() => {
          setRestoring(null);
        }}
      />

      {list === undefined || list.isToolInstalled ? null : (
        <div className="px-4 pt-4">
          <Callout
            tone="warning"
            title={say('screens.adminArea.backupsPanel.backupsCannotBeTakenHere')}
          >
            {say('screens.adminArea.backupsPanel.toolIsNotInstalled', { tool: list.tool })}
          </Callout>
        </div>
      )}

      {asked.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.backupsPanel.theBackupsCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : list === undefined ? (
        <Spinner
          isCentered
          size="sm"
          label={say('screens.adminArea.backupsPanel.readingTheBackups')}
        />
      ) : (
        <DataTable
          label={say('screens.adminArea.adminSections.backups')}
          columns={columns}
          rows={[...list.backups]}
          getRowId={(backup) => backup.name}
          emptyMessage={say('screens.adminArea.backupsPanel.noBackupsYet')}
        />
      )}
    </PanelCard>
  );
};

BackupsPanel.displayName = 'BackupsPanel';

export { BackupsPanel };
