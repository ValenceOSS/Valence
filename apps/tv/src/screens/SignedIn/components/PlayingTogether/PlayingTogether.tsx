import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useWhereToBegin } from '@ValenceClient/party/useWhereToBegin';
import { usePreRoll } from '@ValenceClient/playback/usePreRoll';
import { PreRollClip } from '@ValenceTv/components/PreRollClip/PreRollClip';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { Player } from '@ValenceTv/screens/Player/Player';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PlayingTogetherProps } from './PlayingTogether.types';
import { say } from '@ValenceI18n/say';

/**
 * The player, for somebody who may be arriving into a watch party: the party they were invited to
 * is joined, and the film is held back a moment until the room says where it is, so it opens where
 * everybody else has got to rather than where this account last left it. Leaving the film leaves
 * the party, as closing the web's player does, including one still being joined. Moving on to
 * another title while in a watch party, such as the next episode, leaves it too, since nobody can
 * watch two things with one room. A pre-roll clip plays first where the server has one, before
 * a title chosen rather than one that followed on, from the beginning and outside a watch party.
 *
 * @param watchParty - The party this television holds.
 * @param invitedTo - The party they were invited to, or nothing.
 * @param mediaId - What to play.
 * @param startSeconds - Where this account had got to, used outside a party.
 * @param onLeave - Told they have left the film.
 */
const PlayingTogether = ({
  watchParty,
  invitedTo,
  mediaId,
  startSeconds,
  onLeave,
  ...rest
}: PlayingTogetherProps) => {
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
  const preRoll = usePreRoll(
    mediaId,
    rest.carriedOn === 0 &&
      beginning.kind !== 'wait' &&
      beginning.atSeconds === 0 &&
      invitedTo === null &&
      partyMediaId === null,
  );
  const leave = () => {
    if (invitedTo !== null || watchParty.party?.kind === 'watch') {
      watchParty.leave();
    }

    onLeave();
  };

  useMenuButton(beginning.kind === 'wait' ? leave : null, true);

  if (beginning.kind === 'wait') {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
        <Text style={styles.words}>{say('common.joiningTheWatchParty')}</Text>
      </View>
    );
  }

  if (preRoll.kind === 'asking') {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (preRoll.kind === 'clip') {
    return <PreRollClip address={preRoll.address} onDone={preRoll.onDone} />;
  }

  return (
    <Player
      {...rest}
      mediaId={mediaId}
      startSeconds={beginning.atSeconds}
      onLeave={leave}
      watchParty={watchParty}
    />
  );
};

PlayingTogether.displayName = 'PlayingTogether';

const styles = StyleSheet.create({
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.space.md },
  words: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { PlayingTogether };
