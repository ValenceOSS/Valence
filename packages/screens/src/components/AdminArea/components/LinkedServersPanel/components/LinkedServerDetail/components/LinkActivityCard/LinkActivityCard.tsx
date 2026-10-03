import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { ActivityList } from './components/ActivityList/ActivityList';
import type { LinkActivityCardProps } from './LinkActivityCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Both sides of the record between this server and one linked server, a card each: what that
 * server and its people asked this one for, and — where its admin shows it — that server's record
 * of what this server's people asked it for, so both admins can answer why somebody was refused.
 *
 * @param server - The linked server.
 * @param thisServer - What this server is called, as the other one shows it.
 */
const LinkActivityCard = ({ server, thisServer }: LinkActivityCardProps) => {
  const ours = useQuery(adminQueries.linkActivity(server.id));
  const theirs = useQuery(adminQueries.theirActivity(server.id));

  return (
    <>
      <PanelCard
        title={say('screens.adminArea.linkedServersPanel.whatNameAskedFor', { name: server.name })}
        isFlush
      >
        {ours.isError ? (
          <CouldNotRead
            said={say('common.thatCouldNotBeRead')}
            isTryingAgain={ours.isFetching}
            onTryAgain={() => {
              void ours.refetch();
            }}
          />
        ) : ours.isPending ? (
          <Spinner isCentered size="sm" label={say('common.reading')} />
        ) : (
          <ActivityList
            entries={ours.data}
            itself={say('screens.adminArea.linkedServersPanel.nameItself', { name: server.name })}
            someone={say('common.someoneFromName', {
              name: server.name,
            })}
          />
        )}
      </PanelCard>

      <PanelCard
        title={say('screens.adminArea.linkedServersPanel.theirRecordOfYourPeople')}
        isFlush
      >
        {theirs.isError ? (
          <CouldNotRead
            said={say('common.thatCouldNotBeRead')}
            isTryingAgain={theirs.isFetching}
            onTryAgain={() => {
              void theirs.refetch();
            }}
          />
        ) : theirs.isPending ? (
          <Spinner isCentered size="sm" label={say('common.reading')} />
        ) : theirs.data.standing === 'shown' ? (
          <ActivityList
            entries={theirs.data.entries}
            itself={say('screens.adminArea.linkedServersPanel.nameItself', { name: thisServer })}
            someone={say('common.someoneFromName', {
              name: thisServer,
            })}
          />
        ) : (
          <p className="px-4 py-4 text-sm text-text-muted">
            {theirs.data.standing === 'notShown'
              ? say('screens.adminArea.linkedServersPanel.nameDoesNotShowThisServerIts', {
                  name: server.name,
                })
              : say('screens.adminArea.linkedServersPanel.nameCouldNotBeReached', {
                  name: server.name,
                })}
          </p>
        )}
      </PanelCard>
    </>
  );
};

LinkActivityCard.displayName = 'LinkActivityCard';

export { LinkActivityCard };
