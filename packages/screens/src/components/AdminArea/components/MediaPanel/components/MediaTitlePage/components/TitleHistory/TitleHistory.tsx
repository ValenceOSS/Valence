import { useQuery } from '@tanstack/react-query';
import { History as HistoryIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { NothingHere } from '@ValenceUI/NothingHere';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { describeTitleValue } from '@ValenceScreens/components/AdminArea/components/SourcedField/describeTitleValue';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import { useTitleChange } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/useTitleChange';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { TitleChange } from '@ValenceContracts/schemas/TitleEdit';
import type { TitleHistoryProps } from './TitleHistory.types';
import { say } from '@ValenceI18n/say';

/**
 * Names what kind of change a change set was.
 *
 * @param action - The kind of change.
 * @returns Its name.
 */
const nameOfAction = (action: TitleChange['action']): string => {
  switch (action) {
    case 'set':
      return say('screens.adminArea.sourcedField.edited');
    case 'reset':
      return say('screens.jobRunner.describeJobGroup.reset');
    case 'lock':
      return say('screens.adminArea.sourcedField.locked');
    case 'undo':
      return say('screens.adminArea.titleDetails.undone');
    case 'rematch':
      return say('screens.admin.auditActionNames.mediaMatchFixed');
  }
};

/**
 * A title's History tab: every change made to its metadata, newest first, each change set as one
 * row saying who made it and what each field went from and to, with a way to undo it.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param kind - The kind of title, which some fields are named by.
 */
const TitleHistory = ({ mediaId, scope, kind }: TitleHistoryProps) => {
  const history = useQuery(adminQueries.titleHistory(mediaId, scope));
  const { undo } = useTitleChange(mediaId, scope);

  const columns: DataTableColumn<TitleChange>[] = [
    {
      id: 'when',
      header: say('screens.observabilityPage.jobHistory.when'),
      meta: { shrinks: true },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {describeSince(row.original.at, Date.now())}
        </span>
      ),
    },
    {
      id: 'who',
      header: say('screens.webhookFields.webhookPanes.who'),
      meta: { shrinks: true, hidesOnPhones: true },
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.by ?? '—'}</span>,
    },
    {
      id: 'change',
      header: say('common.change'),
      meta: { shrinks: true, hidesOnPhones: true },
      cell: ({ row }) => nameOfAction(row.original.action),
    },
    {
      id: 'fields',
      header: say('screens.adminArea.titleHistory.fields'),
      meta: { fills: true },
      cell: ({ row }) => (
        <ul className="flex flex-col gap-1">
          {row.original.fields.map((one) => (
            <li key={one.field} className="text-sm">
              {say('screens.adminArea.titleHistory.fieldWentFromTo', {
                field: labelOfField(one.field, kind),
                before: describeTitleValue(one.before),
                after: describeTitleValue(one.after),
              })}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      meta: { shrinks: true },
      cell: ({ row }) => (
        <ActionMenu
          label={say('common.actionsForName', { name: nameOfAction(row.original.action) })}
          groups={[
            {
              items: [
                {
                  id: 'undo',
                  label: say('common.undo'),
                  onChoose: () => {
                    void undo(row.original.changeSetId);
                  },
                },
              ],
            },
          ]}
        />
      ),
    },
  ];

  return (
    <PanelCard title={say('common.history')} isFlush>
      {history.isPending ? (
        <Spinner isCentered size="sm" label={say('common.loading')} />
      ) : history.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.titleHistory.theHistoryCouldNotBeRead')}
          why={history.error.message}
          onTryAgain={() => {
            void history.refetch();
          }}
          isTryingAgain={history.isFetching}
        />
      ) : history.data.changes.length === 0 ? (
        <NothingHere
          of={HistoryIcon}
          isCompact
          title={say('screens.adminArea.titleHistory.nothingChangedYet')}
        />
      ) : (
        <DataTable
          label={say('common.history')}
          columns={columns}
          rows={history.data.changes}
          getRowId={(change) => change.changeSetId}
          pageSize={25}
        />
      )}
    </PanelCard>
  );
};

TitleHistory.displayName = 'TitleHistory';

export { TitleHistory };
