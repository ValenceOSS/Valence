import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Button } from '@ValenceTv/components/Button/Button';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PreRollClipProps } from './PreRollClip.types';
import { say } from '@ValenceI18n/say';

const GIVES_UP_AFTER_MILLISECONDS = 6_000;

const styles = StyleSheet.create({
  picture: { flex: 1 },
  skip: { bottom: tokens.space.xl, position: 'absolute', right: tokens.space.xl },
  whole: { backgroundColor: '#000000', flex: 1 },
});

/**
 * The clip played before a film or episode, filling the television, with Skip focused so one press
 * passes it, and Menu doing the same. It hands on to the title when it ends, when it is skipped,
 * and when it cannot be played — refused, or not started within a few seconds — so a pre-roll can
 * only ever delay a title, never stop it.
 *
 * @param address - Where the clip is on the server.
 * @param onDone - Told once the title should start.
 */
const PreRollClip = ({ address, onDone }: PreRollClipProps) => {
  const player = useVideoPlayer({ uri: onTheServer(address), headers: signedHeaders() }, (made) => {
    made.play();
  });

  useMenuButton(onDone, true);

  useEffect(() => {
    const givesUp = setTimeout(onDone, GIVES_UP_AFTER_MILLISECONDS);

    const started = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        clearTimeout(givesUp);
      }
    });

    return () => {
      clearTimeout(givesUp);
      started.remove();
    };
  }, [player, onDone]);

  useEventListener(player, 'playToEnd', onDone);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') {
      onDone();
    }
  });

  return (
    <View style={styles.whole}>
      <VideoView
        style={styles.picture}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />

      <View style={styles.skip}>
        <Button
          label={say('common.skip')}
          variant="overlay"
          size="md"
          hasPreferredFocus
          onPress={onDone}
        />
      </View>
    </View>
  );
};

PreRollClip.displayName = 'PreRollClip';

export { PreRollClip };
