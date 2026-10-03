import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw as RefreshCwIcon } from '@keyline-icons/react';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { syncLinkedServer } from '@ValenceClient/admin/syncLinkedServer';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { LIBRARY_KIND_NAMES } from '@ValenceClient/library/LIBRARY_KIND_NAMES';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { TheirLibrariesCardProps } from './TheirLibrariesCard.types';
import { say } from '@ValenceI18n/say';

/**
 * What one linked server shares with this one, asked of it as the card opens: its libraries by name
 * and kind, that it shares nothing yet, or that it could not be reached — and a way to read it all
 * again now, rather than waiting for the next time it is read on its own.
 *
 * @param server - The linked server.
 */
const TheirLibrariesCard = ({ server }: TheirLibrariesCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.theirLibraries(server.id));
  const [isReading, setIsReading] = useState(false);

  const readAgain = () => {
    setIsReading(true);

    void syncLinkedServer(server.id)
      .then(async (sent) => {
        const isRead = tellOutcome(
          say('screens.adminArea.linkedServersPanel.readCountTitlesFromName', {
            count: String(sent.value?.kept ?? 0),
            name: server.name,
          }),
          failureOfRefusal(sent.refusal),
        );

        if (isRead) {
          await Promise.all([
            cache.invalidateQueries({ queryKey: adminQueries.theirLibraries(server.id).queryKey }),
            cache.invalidateQueries({ queryKey: libraryQueries.all().queryKey }),
          ]);
        }
      })
      .finally(() => {
        setIsReading(false);
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
        <PanelCardAction icon={RefreshCwIcon} isLoading={isReading} onClick={readAgain}>
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
              <span className="truncate text-sm font-medium">{library.name}</span>
              <span className="text-xs text-text-muted">{LIBRARY_KIND_NAMES[library.kind]}</span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
};

TheirLibrariesCard.displayName = 'TheirLibrariesCard';

export { TheirLibrariesCard };
