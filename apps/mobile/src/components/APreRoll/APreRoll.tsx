import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Button } from '@ValenceMobile/components/Button/Button';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { turnThisPhoneSideways } from '@ValenceMobile/platform/turnThisPhoneSideways';
import type { VideoSource } from 'expo-video';
import type { APreRollProps } from './APreRoll.types';
import { say } from '@ValenceI18n/say';

const GIVES_UP_AFTER_MILLISECONDS = 6_000;

const styles = StyleSheet.create({
  picture: { flex: 1 },
  skip: { position: 'absolute' },
  whole: { backgroundColor: '#000000', flex: 1 },
});

/**
 * The clip played before a film or episode, filling the phone turned on its side as the film will
 * be, with a way to skip it. It hands on to the title when it ends, when it is skipped, and when it
 * cannot be played — refused, or not started within a few seconds — so a pre-roll can only ever
 * delay a title, never stop it.
 *
 * @param address - Where the clip is on the server.
 * @param onDone - Told once the title should start.
 */
const APreRoll = ({ address, onDone }: APreRollProps) => {
  const room = useSafeAreaInsets();
  const [source, setSource] = useState<VideoSource | null>(null);
  const player = useVideoPlayer(source, (ready) => {
    ready.play();
  });

  useEffect(() => turnThisPhoneSideways(), []);

  useEffect(() => {
    const uri = onThisServer(address);
    let isGone = false;

    void theCookiesThisPhoneHolds(uri).then((cookie) => {
      if (!isGone) {
        setSource(cookie === null ? { uri } : { uri, headers: { Cookie: cookie } });
      }
    });

    return () => {
      isGone = true;
    };
  }, [address]);

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

      <View
        style={[
          styles.skip,
          {
            bottom: Math.max(room.bottom, PLAYER_LOOK.edge),
            right: Math.max(room.right, PLAYER_LOOK.edge),
          },
        ]}
      >
        <Button tone="ghost" onPress={onDone}>
          {say('common.skip')}
        </Button>
      </View>
    </View>
  );
};

APreRoll.displayName = 'APreRoll';

export { APreRoll };
