import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useWhereToBegin } from '@ValenceClient/party/useWhereToBegin';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Watching } from '@ValenceMobile/components/Watching/Watching';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { WatchingTogetherProps } from './WatchingTogether.types';
import { say } from '@ValenceI18n/say';

/**
 * The player, for somebody who may be arriving into a watch party: the party they were invited to
 * is joined, and the film is held back a moment until the room says where it is, so it opens where
 * everybody else has got to rather than where this account last left it. Stopping watching leaves
 * the party, as closing the web's player does, including one still being joined. Moving on to
 * another title while in a watch party, such as the next episode, leaves it too, since nobody can
 * watch two things with one room.
 *
 * @param watchParty - The party this phone holds.
 * @param invitedTo - The party they were invited to, or nothing.
 * @param mediaId - What to watch.
 * @param startSeconds - Where this account had got to, used outside a party.
 * @param onDone - Told they have stopped watching.
 */
const WatchingTogether = ({
  watchParty,
  invitedTo,
  mediaId,
  startSeconds = 0,
  onDone,
  ...rest
}: WatchingTogetherProps) => {
  const colours = useTheColours();
  const partyMediaId = watchParty.party?.kind === 'watch' ? watchParty.party.mediaId : null;
  const { leave: leaveTheParty } = watchParty;

  useEffect(() => {
    if (invitedTo === null && partyMediaId !== null && partyMediaId !== mediaId) {
      leaveTheParty();
    }
  }, [invitedTo, partyMediaId, mediaId, leaveTheParty]);

  const beginning = useWhereToBegin({
    watchParty,
    invitedTo,
    mediaId,
    resumeSeconds: startSeconds,
    isReady: true,
  });
  const stop = () => {
    if (invitedTo !== null || watchParty.party?.kind === 'watch') {
      watchParty.leave();
    }

    onDone();
  };

  if (beginning.kind === 'wait') {
    return (
      <Screen centres onBack={stop}>
        <ActivityIndicator color={colours.textMuted} />
        <Words tone="muted">{say('common.joiningTheWatchParty')}</Words>
      </Screen>
    );
  }

  return (
    <Watching
      {...rest}
      mediaId={mediaId}
      startSeconds={beginning.atSeconds}
      onDone={stop}
      watchParty={watchParty}
    />
  );
};

WatchingTogether.displayName = 'WatchingTogether';

export { WatchingTogether };
