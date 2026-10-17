import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { Tooltip } from '@ValenceUI/Tooltip';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { AUDIT_ACTIONS, AuditActionSchema } from '@ValenceContracts/schemas/Audit';
import type { AuditAction, AuditEntry } from '@ValenceContracts/schemas/Audit';
import { PanelCardChoice } from '@ValenceScreens/components/PanelCardChoice/PanelCardChoice';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { AUDIT_ACTION_NAMES } from '@ValenceScreens/admin/AUDIT_ACTION_NAMES';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';

const EVERY_CHANGE = 'every';

const ACTION_OPTIONS = [
  { id: EVERY_CHANGE, label: say('screens.adminArea.auditPanel.everyChange') },
  ...AUDIT_ACTIONS.map((action) => ({ id: action, label: AUDIT_ACTION_NAMES[action] })),
];

/**
 * Who changed what on this server, newest first: accounts and roles, settings, libraries, files,
 * links, plugins, webhooks and backups, each with who did it, when, and what it was done to. It can
 * be narrowed to one kind of change, and reads further back a page at a time.
 */
const AuditPanel = () => {
  const [action, setAction] = useState<AuditAction | null>(null);
  const asked = useInfiniteQuery(adminQueries.auditPages(action === null ? {} : { action }));
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const entries = asked.data?.pages.flatMap((page) => page.entries) ?? [];

  const columns = useMemo<DataTableColumn<AuditEntry>[]>(
    () => [
      {
        id: 'at',
        header: say('screens.observabilityPage.jobHistory.when'),
        accessorFn: (entry) => entry.at,
        cell: ({ row }) => (
          <Tooltip label={new Date(row.original.at).toLocaleString()}>
            <span className="whitespace-nowrap text-xs tabular-nums text-text-muted">
              {describeSince(row.original.at, now)}
            </span>
          </Tooltip>
        ),
      },
      {
        id: 'actor',
        header: say('screens.webhookFields.webhookPanes.who'),
        accessorFn: (entry) => entry.actorName,
        cell: ({ row }) => (
          <span className="truncate font-medium text-text">
            {row.original.actorName === ''
              ? say('screens.adminArea.auditPanel.somebodySinceRemoved')
              : row.original.actorName}
          </span>
        ),
      },
      {
        id: 'action',
        header: say('screens.adminArea.overviewPanel.whatIsOn'),
        accessorFn: (entry) => AUDIT_ACTION_NAMES[entry.action],
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="whitespace-nowrap text-text">
              {AUDIT_ACTION_NAMES[row.original.action]}
            </span>

            {row.original.target === null ? null : (
              <span className="max-w-[40vw] truncate text-xs text-text-muted sm:hidden">
                {row.original.target}
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'target',
        meta: { hidesOnPhones: true },
        header: say('screens.adminArea.auditPanel.onWhat'),
        accessorFn: (entry) => entry.target ?? '',
        cell: ({ row }) => (
          <span className="flex max-w-[min(36rem,50vw)] min-w-0 flex-col gap-0.5">
            <Tooltip label={row.original.target ?? '—'}>
              <span className="truncate text-text">{row.original.target ?? '—'}</span>
            </Tooltip>

            {row.original.detail === null ? null : (
              <span className="truncate text-xs text-text-muted">
                {Object.values(row.original.detail).join(' · ')}
              </span>
            )}
          </span>
        ),
      },
    ],
    [now],
  );

  return (
    <PanelCard
      title={say('screens.adminArea.adminSections.auditLog')}
      isFlush
      actions={
        <>
          <PanelCardChoice
            label={say('screens.adminArea.auditPanel.whichChanges')}
            options={ACTION_OPTIONS}
            value={action ?? EVERY_CHANGE}
            onSelect={(id) => {
              const chosen = AuditActionSchema.safeParse(id);

              setAction(chosen.success ? chosen.data : null);
            }}
          />
          <PanelCardInfo
            label={say('screens.adminArea.auditPanel.aboutTheAuditLog')}
            detail={say('screens.adminArea.auditPanel.everyChangeAnAdministratorMakes')}
          />
        </>
      }
    >
      {asked.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.auditPanel.theAuditLogCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner
          isCentered
          size="sm"
          label={say('screens.adminArea.auditPanel.readingTheAuditLog')}
        />
      ) : (
        <>
          <DataTable
            height="fills"
            label={say('screens.adminArea.adminSections.auditLog')}
            columns={columns}
            rows={entries}
            getRowId={(entry) => entry.id}
            emptyMessage={say('screens.adminArea.auditPanel.nothingHasBeenChangedYet')}
          />

          {asked.hasNextPage ? (
            <div className="flex justify-center p-3">
              <Button
                variant="secondary"
                size="sm"
                isLoading={asked.isFetchingNextPage}
                onClick={() => {
                  void asked.fetchNextPage();
                }}
              >
                {say('screens.adminArea.auditPanel.readFurtherBack')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </PanelCard>
  );
};

AuditPanel.displayName = 'AuditPanel';

export { AuditPanel };
