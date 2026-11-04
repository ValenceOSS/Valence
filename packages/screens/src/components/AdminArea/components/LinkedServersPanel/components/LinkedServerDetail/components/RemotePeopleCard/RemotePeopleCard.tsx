import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { DataTable } from '@ValenceUI/DataTable';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCard } from '@ValenceUI/PanelCard';
import { blockRemotePerson } from '@ValenceClient/admin/blockRemotePerson';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { RemotePerson } from '@ValenceContracts/schemas/LinkSharing';
import type { RemotePeopleCardProps } from './RemotePeopleCard.types';
import { say } from '@ValenceI18n/say';

/**
 * The people from one linked server who have asked this one for anything, most recently seen first:
 * by name where their server sends it, when they were last seen, and a way to block any one of them
 * — or let them back in — without unlinking the whole server.
 *
 * @param server - The linked server.
 */
const RemotePeopleCard = ({ server }: RemotePeopleCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.remotePeople(server.id));
  const activity = useQuery(adminQueries.linkActivity(server.id));
  const [working, setWorking] = useState<string | null>(null);
  const title = say('screens.adminArea.linkedServersPanel.peopleFromName', { name: server.name });
  const nameOf = (person: RemotePerson) =>
    person.name ?? say('common.someoneFromName', { name: server.name });

  const block = (person: RemotePerson) => {
    const isBlocking = person.blockedAt === null;

    setWorking(person.id);

    void blockRemotePerson(server.id, person.id, isBlocking)
      .then(async (sent) => {
        const done = isBlocking
          ? say('screens.adminArea.linkedServersPanel.blockedName', { name: nameOf(person) })
          : say('screens.adminArea.linkedServersPanel.letNameBackIn', { name: nameOf(person) });

        if (tellOutcome(done, failureOfRefusal(sent.refusal))) {
          await cache.invalidateQueries({
            queryKey: adminQueries.remotePeople(server.id).queryKey,
          });
        }
      })
      .finally(() => {
        setWorking(null);
      });
  };

  const requestsOf = new Map<string, number>();

  for (const entry of activity.data ?? []) {
    if (entry.personId !== null && entry.action === 'requests') {
      requestsOf.set(entry.personId, (requestsOf.get(entry.personId) ?? 0) + entry.count);
    }
  }

  const columns: DataTableColumn<RemotePerson>[] = [
    {
      id: 'person',
      header: say('common.person'),
      accessorFn: nameOf,
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-text">{nameOf(row.original)}</span>
          {row.original.blockedAt === null ? null : (
            <Badge tone="danger" size="sm">
              {say('common.blocked')}
            </Badge>
          )}
        </span>
      ),
    },
    {
      id: 'seen',
      header: say('screens.adminArea.linkedServersPanel.lastSeen'),
      accessorFn: (person) => person.lastSeenAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {saidWhen(row.original.lastSeenAt)}
        </span>
      ),
    },
    {
      id: 'requests',
      meta: { hidesOnPhones: true },
      header: say('common.requests'),
      accessorFn: (person) => requestsOf.get(person.id) ?? 0,
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">{requestsOf.get(row.original.id) ?? 0}</span>
      ),
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const person = row.original;
        const isBlocked = person.blockedAt !== null;

        return (
          <span className="flex justify-end">
            <Button
              variant={isBlocked ? 'secondary' : 'ghost'}
              size="sm"
              isLoading={working === person.id}
              label={
                isBlocked
                  ? say('screens.adminArea.linkedServersPanel.letNameBackInAsk', {
                      name: nameOf(person),
                    })
                  : say('screens.adminArea.linkedServersPanel.blockName', { name: nameOf(person) })
              }
              onClick={() => {
                block(person);
              }}
            >
              {isBlocked ? say('common.letBackIn') : say('common.block')}
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <PanelCard title={title} isFlush>
      {asked.isError ? (
        <CouldNotRead
          said={say('common.thatCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner isCentered size="sm" label={say('common.reading')} />
      ) : asked.data.length === 0 ? (
        <p className="px-4 py-6 text-sm text-text-muted">
          {say('screens.adminArea.linkedServersPanel.nobodyFromNameHasAskedFor', {
            name: server.name,
          })}
        </p>
      ) : (
        <DataTable
          label={title}
          columns={columns}
          rows={asked.data}
          getRowId={(person) => person.id}
          pageSize={10}
        />
      )}
    </PanelCard>
  );
};

RemotePeopleCard.displayName = 'RemotePeopleCard';

export { RemotePeopleCard };
