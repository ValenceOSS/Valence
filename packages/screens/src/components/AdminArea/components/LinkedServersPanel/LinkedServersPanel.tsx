import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { ThisServerCard } from './components/ThisServerCard/ThisServerCard';
import { InviteCard } from './components/InviteCard/InviteCard';
import { LinkToServerCard } from './components/LinkToServerCard/LinkToServerCard';
import { LinkedServerList } from './components/LinkedServerList/LinkedServerList';
import { say } from '@ValenceI18n/say';

const ASKS_AGAIN_MS = 15_000;

/**
 * Linking this Valence with others: how other servers see this one, inviting another server,
 * using another server's invite, and the servers linked with this one or on the way to being. Read
 * again every few seconds while a request is waiting on either side, so an approval made on the
 * other server shows here without anybody reloading.
 */
const LinkedServersPanel = () => {
  const asked = useQuery({
    ...adminQueries.linking(),
    refetchInterval: (query) =>
      (query.state.data?.servers ?? []).some(
        (server) => server.state === 'awaitingThem' || server.state === 'awaitingUs',
      )
        ? ASKS_AGAIN_MS
        : false,
  });

  if (asked.isError) {
    return (
      <CouldNotRead
        said={say('screens.adminArea.linkedServersPanel.linkedServersCouldNotBeRead')}
        isTryingAgain={asked.isFetching}
        onTryAgain={() => {
          void asked.refetch();
        }}
      />
    );
  }

  if (asked.isPending) {
    return (
      <Spinner
        isCentered
        size="sm"
        label={say('screens.adminArea.linkedServersPanel.readingLinkedServers')}
      />
    );
  }

  const { identity, invites, servers } = asked.data;

  return (
    <div className="flex flex-col gap-4">
      <LinkedServerList servers={servers} />
      <div className="grid gap-4 lg:grid-cols-2">
        <InviteCard invites={invites} />
        <LinkToServerCard />
      </div>
      <ThisServerCard identity={identity} />
    </div>
  );
};

LinkedServersPanel.displayName = 'LinkedServersPanel';

export { LinkedServersPanel };
