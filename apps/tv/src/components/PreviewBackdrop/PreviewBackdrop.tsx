import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { readPreviewState } from '@ValenceClient/playback/readPreviewState';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import type { PreviewBackdropProps } from './PreviewBackdrop.types';

const SETTLES_MS = 2500;

const FADES_IN_MS = 900;

const FADES_OUT_MS = 200;

/**
 * A title's picture that comes to life: its still at once, then — once whoever is looking has settled
 * on it — the short, silent preview the server cuts from it, faded in over the still and looping.
 *
 * As the web's does, the preview is not asked for until the still has had the screen to itself for
 * a moment and the server has said a preview exists, so the still is never kept waiting behind a
 * video downloading beside it, and a title with no preview yet simply stays a still. Nothing plays
 * while the backdrop is covered, so a page opened on top does not leave a preview running behind it.
 *
 * The system's player takes focus on a television, and would pull the remote into an invisible
 * picture behind the buttons; nothing here can be touched, so it never can.
 *
 * @param mediaId - The title.
 * @param stillPath - Its still, shown until the preview is playing.
 * @param isPlaying - Whether the preview may play now.
 * @param style - Its size and place.
 */
const PreviewBackdrop = ({ mediaId, stillPath, isPlaying, style }: PreviewBackdropProps) => {
  const shown = useRef(new Animated.Value(0)).current;
  const isLoaded = useRef(false);
  const player = useVideoPlayer(null, (made) => {
    made.muted = true;
    made.loop = true;
  });

  useEffect(() => {
    const playing = player.addListener('playingChange', ({ isPlaying: isOn }) => {
      Animated.timing(shown, {
        toValue: isOn ? 1 : 0,
        duration: isOn ? FADES_IN_MS : FADES_OUT_MS,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      playing.remove();
    };
  }, [player, shown]);

  useEffect(() => {
    if (!isPlaying) {
      player.pause();

      return;
    }

    let isAbandoned = false;
    const address = onTheServer(`/api/media/${mediaId}/preview`);

    const timer = setTimeout(() => {
      if (isLoaded.current) {
        player.play();

        return;
      }

      void readPreviewState(address).then(async (state) => {
        if (isAbandoned || state !== 'ready') {
          return;
        }

        await player.replaceAsync({ uri: address, headers: signedHeaders() });

        if (!isAbandoned) {
          isLoaded.current = true;
          player.play();
        }
      });
    }, SETTLES_MS);

    return () => {
      isAbandoned = true;
      clearTimeout(timer);
    };
  }, [isPlaying, mediaId, player]);

  return (
    <View style={[styles.frame, style]} pointerEvents="none" collapsable={false}>
      <Artwork path={stillPath} style={StyleSheet.absoluteFill} isUrgent />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown }]}>
        <VideoView
          player={player}
          pointerEvents="none"
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
