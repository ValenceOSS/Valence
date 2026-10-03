import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
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
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {asked.data.map((person) => {
            const isBlocked = person.blockedAt !== null;
            const lastSeen = saidWhen(person.lastSeenAt);

            return (
              <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{nameOf(person)}</span>
                    {isBlocked ? (
                      <Badge size="sm" tone="danger">
                        {say('common.blocked')}
                      </Badge>
                    ) : null}
                  </div>
                  {lastSeen === null ? null : (
                    <span className="text-xs text-text-muted">
                      {say('screens.adminArea.linkedServersPanel.seenWhen', { when: lastSeen })}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={working === person.id}
                  label={
                    isBlocked
                      ? say('screens.adminArea.linkedServersPanel.letNameBackInAsk', {
                          name: nameOf(person),
                        })
                      : say('screens.adminArea.linkedServersPanel.blockName', {
                          name: nameOf(person),
                        })
                  }
                  onClick={() => {
                    block(person);
                  }}
                >
                  {isBlocked ? say('common.letBackIn') : say('common.block')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
};

RemotePeopleCard.displayName = 'RemotePeopleCard';

export { RemotePeopleCard };
