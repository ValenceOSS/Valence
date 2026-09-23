import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { sourceForAFile } from '@ValenceClient/downloads/keepingFiles';
import { rememberWatchedOffline, watchedOffline } from '@ValenceClient/offline/watchedOffline';
import { BackArrow } from '@ValencePhone/components/BackArrow/BackArrow';
import { turnThisPhoneSideways } from '@ValencePhone/platform/turnThisPhoneSideways';
import type { WatchingHeldProps } from './WatchingHeld.types';

const REMEMBER_EVERY = 5000;

const styles = StyleSheet.create({
  picture: { flex: 1 },
  whole: { backgroundColor: '#000000', flex: 1 },
});

/**
 * Watching a film this phone keeps, with nothing asked of the server: played straight from the
 * file, with the system's own controls, from wherever it was left.
 *
 * Where somebody got to is remembered on the phone, and handed to the server the next time it
 * answers, as the web's offline player does.
 *
 * @param file - The film.
 * @param onDone - Told they have stopped watching.
 */
const WatchingHeld = ({ file, onDone }: WatchingHeldProps) => {
  const startAt =
    watchedOffline().find((one) => one.mediaId === file.mediaId)?.positionSeconds ?? 0;
  const player = useVideoPlayer({ uri: sourceForAFile(file.downloadId) }, (ready) => {
    ready.currentTime = startAt;
    ready.play();
  });

  useEffect(() => {
    const letGo = turnThisPhoneSideways();
    const remembering = setInterval(() => {
      if (player.duration > 0) {
        rememberWatchedOffline(file.mediaId, player.currentTime, player.duration);
      }
    }, REMEMBER_EVERY);

    return () => {
      clearInterval(remembering);

      if (player.duration > 0) {
        rememberWatchedOffline(file.mediaId, player.currentTime, player.duration);
      }

      letGo();
    };
  }, [player, file.mediaId]);

  return (
    <View style={styles.whole}>
      <VideoView style={styles.picture} player={player} nativeControls contentFit="contain" />
      <BackArrow onBack={onDone} />
    </View>
  );
};

WatchingHeld.displayName = 'WatchingHeld';

export { WatchingHeld };
