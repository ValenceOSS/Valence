import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import type { PreviewBackdropProps } from './PreviewBackdrop.types';

const SETTLES_MS = 1800;

const FADES_IN_MS = 900;

/**
 * A title's picture that comes to life: its still first, then — once whoever is looking has settled
 * on it — the short, silent preview the server cuts from it, faded in over the still and looping.
 *
 * A title with no preview yet, or one that will not play, simply stays a still. Nothing plays while
 * the backdrop is covered, so a page opened on top does not leave a preview running behind it.
 *
 * @param mediaId - The title.
 * @param stillPath - Its still, shown until the preview is playing.
 * @param isPlaying - Whether the preview may play now.
 * @param style - Its size and place.
 */
const PreviewBackdrop = ({ mediaId, stillPath, isPlaying, style }: PreviewBackdropProps) => {
  const shown = useRef(new Animated.Value(0)).current;
  const player = useVideoPlayer(
    { uri: onTheServer(`/api/media/${mediaId}/preview`), headers: signedHeaders() },
    (made) => {
      made.muted = true;
      made.loop = true;
    },
  );

  useEffect(() => {
    if (!isPlaying) {
      player.pause();
      Animated.timing(shown, { toValue: 0, duration: 200, useNativeDriver: true }).start();

      return;
    }

    const timer = setTimeout(() => {
      player.play();
    }, SETTLES_MS);

    const playing = player.addListener('playingChange', ({ isPlaying: isOn }) => {
      Animated.timing(shown, {
        toValue: isOn ? 1 : 0,
        duration: FADES_IN_MS,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      clearTimeout(timer);
      playing.remove();
    };
  }, [isPlaying, player, shown]);

  return (
    <View style={[styles.frame, style]} pointerEvents="none">
      <Artwork path={stillPath} style={StyleSheet.absoluteFill} />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown }]}>
        <VideoView
          player={player}
          nativeControls={false}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

PreviewBackdrop.displayName = 'PreviewBackdrop';

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
});

export { PreviewBackdrop };
