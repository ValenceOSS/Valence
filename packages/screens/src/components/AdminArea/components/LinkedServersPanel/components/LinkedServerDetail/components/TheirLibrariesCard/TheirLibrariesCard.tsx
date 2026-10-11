import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw as RefreshCwFilledIcon } from '@keyline-icons/react/fill';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useSyncLinkedServer } from '@ValenceScreens/admin/useSyncLinkedServer';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { chooseTheirLibrary } from '@ValenceClient/admin/chooseTheirLibrary';
import { syncLinkedServer } from '@ValenceClient/admin/syncLinkedServer';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { cn } from '@ValenceUI/cn';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { LIBRARY_KIND_NAMES } from '@ValenceClient/library/LIBRARY_KIND_NAMES';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { TheirLibrary } from '@ValenceContracts/schemas/LinkSharing';
import type { TheirLibrariesCardProps } from './TheirLibrariesCard.types';
import { say } from '@ValenceI18n/say';

/**
 * What one linked server shares with this one, asked of it as the card opens: its libraries by name
 * and kind, each with a switch for whether it shows on this server, that it shares nothing yet, or
 * that it could not be reached — and a way to read it all again now, rather than waiting for the
 * next time it is read on its own. Switching a library off takes it and everything in it off this
 * server at once; switching it back on reads it in again.
 *
 * @param server - The linked server.
 */
const TheirLibrariesCard = ({ server }: TheirLibrariesCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.theirLibraries(server.id));
  const { syncing, sync } = useSyncLinkedServer();
  const [choosing, setChoosing] = useState<string | null>(null);

  const choose = (library: TheirLibrary) => {
    const isTaken = !library.isTaken;

    setChoosing(library.id);

    void chooseTheirLibrary(server.id, library.id, isTaken)
      .then(async (sent) => {
        const isChosen = tellOutcome(
          say(
            isTaken
              ? 'screens.adminArea.linkedServersPanel.nameShowsOnThisServer'
              : 'screens.adminArea.linkedServersPanel.nameIsLeftOffThisServer',
            { name: library.name },
          ),
          failureOfRefusal(sent.refusal),
        );

        if (isChosen) {
          await cache.invalidateQueries({
            queryKey: adminQueries.theirLibraries(server.id).queryKey,
          });
          await syncLinkedServer(server.id);
          await cache.invalidateQueries({ queryKey: libraryQueries.all().queryKey });
        }
      })
      .finally(() => {
        setChoosing(null);
      });
  };
  const title = say('screens.adminArea.linkedServersPanel.whatNameSharesWithYou', {
    name: server.name,
  });

  return (
    <PanelCard
      title={title}
      isFlush
      actions={
        <PanelCardAction
          icon={RefreshCwFilledIcon}
          isLoading={syncing === server.id}
          onClick={() => {
            void sync(server.id, server.name);
          }}
        >
          {say('screens.adminArea.linkedServersPanel.readAgainNow')}
        </PanelCardAction>
      }
    >
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
      ) : !asked.data.isReachable || asked.data.libraries.length === 0 ? (
        <p className="px-4 py-6 text-sm text-text-muted">
          {asked.data.isReachable
            ? say('screens.adminArea.linkedServersPanel.nameSharesNothingWithThisServer', {
                name: server.name,
              })
            : say('screens.adminArea.linkedServersPanel.nameCouldNotBeReached', {
                name: server.name,
              })}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {asked.data.libraries.map((library) => (
            <li key={library.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    library.isTaken ? '' : 'text-text-muted',
                  )}
                >
                  {library.name}
                </span>
                <span className="text-xs text-text-muted">{LIBRARY_KIND_NAMES[library.kind]}</span>
              </span>
              <Switch
                label={say('screens.adminArea.linkedServersPanel.showNameOnThisServer', {
                  name: library.name,
                })}
                isLabelHidden
                isOn={library.isTaken}
                disabled={choosing !== null}
                onToggle={() => {
                  choose(library);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
};

TheirLibrariesCard.displayName = 'TheirLibrariesCard';

export { TheirLibrariesCard };
