import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { FEDERATION_ACTION_NAMES } from '@ValenceClient/linking/FEDERATION_ACTION_NAMES';
import { FEDERATION_OUTCOME_NAMES } from '@ValenceClient/linking/FEDERATION_OUTCOME_NAMES';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { FederationActivity } from '@ValenceContracts/schemas/LinkSharing';
import type { ActivityListProps } from './ActivityList.types';

/**
 * A record of what one server asked another for, as a table like the audit log: who asked, what
 * for and about which title, how it was answered, how many times and when. Every answer is a badge,
 * so an allowed one reads as plainly as a refused one.
 *
 * @param entries - The record.
 * @param itself - What to call a request the server made for itself.
 * @param someone - What to call a person whose name was not sent.
 */
const ActivityList = ({ entries, itself, someone }: ActivityListProps) => {
  const columns: DataTableColumn<FederationActivity>[] = [
    {
      id: 'person',
      header: say('common.person'),
      accessorFn: (entry) => (entry.personId === null ? itself : (entry.personName ?? someone)),
      cell: ({ getValue }) => (
        <span className="truncate font-medium text-text">{String(getValue())}</span>
      ),
    },
    {
      id: 'asked',
      header: say('screens.adminArea.linkedServersPanel.askedFor'),
      accessorFn: (entry) => FEDERATION_ACTION_NAMES[entry.action],
      cell: ({ row }) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text">{FEDERATION_ACTION_NAMES[row.original.action]}</span>
          {row.original.mediaTitle === null ? null : (
            <span className="truncate text-xs text-text-muted">{row.original.mediaTitle}</span>
          )}
        </span>
      ),
    },
    {
      id: 'outcome',
      header: say('common.status'),
      accessorFn: (entry) => FEDERATION_OUTCOME_NAMES[entry.outcome],
      cell: ({ row }) => (
        <Badge tone={row.original.outcome === 'allowed' ? 'success' : 'danger'}>
          {FEDERATION_OUTCOME_NAMES[row.original.outcome]}
        </Badge>
      ),
    },
    {
      id: 'times',
      meta: { hidesOnPhones: true },
      header: say('screens.adminArea.linkedServersPanel.times'),
      accessorFn: (entry) => entry.count,
      cell: ({ row }) => <span className="tabular-nums text-text-muted">{row.original.count}</span>,
    },
    {
      id: 'when',
      header: say('screens.observabilityPage.jobHistory.when'),
      accessorFn: (entry) => entry.at,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">{saidWhen(row.original.at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      label={say('screens.adminArea.adminSections.activity')}
      columns={columns}
      rows={[...entries]}
      getRowId={(entry) => entry.id}
      pageSize={10}
      emptyMessage={say('common.nothingYet')}
    />
  );
};

ActivityList.displayName = 'ActivityList';

export { ActivityList };
