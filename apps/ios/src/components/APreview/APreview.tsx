import { useEffect, useState } from 'react';
import { useEvent, useEventListener } from 'expo';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { readPreviewState } from '@ValenceClient/playback/readPreviewState';
import { hushThePlayer } from '@ValencePhone/playback/hushThePlayer';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValencePhone/platform/theCookiesThisPhoneHolds';
import type { VideoSource } from 'expo-video';
import type { APreviewProps } from './APreview.types';

const SETTLE_FOR = 2500;

const FADES_IN_OVER = 700;

const LETS_GO_AFTER = 1000;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * A title's backdrop, and a few seconds after it is on screen a clip of the title fading in over
 * it, as the web draws the head of a title: filling whatever holds it, cropped to cover it.
 *
 * The clip is only asked for once the title has been on screen for a moment and only where the
 * server has made one, so scrolling past a title fetches nothing, and it stops the moment the title
 * is no longer showing. It is let go a moment after that rather than at once, holding its last
 * frame, since the page may be drawing the same clip behind itself and fading it out.
 *
 * @param mediaId - The title.
 * @param hasBackdrop - Whether it has a backdrop to draw until the clip arrives.
 * @param isShowing - Whether it is in view, and so whether its clip may play.
 * @param isMuted - Whether the clip is silent.
 * @param onEnded - Told when the clip has played through.
 * @param onPlaying - Told when the clip starts or stops playing.
 * @param onClip - Told the clip's player while it plays, and nothing once it stops, so the page
 *   can draw the same clip behind itself without playing it twice.
 */
const APreview = ({
  mediaId,
  hasBackdrop,
  isShowing,
  isMuted,
  onEnded,
  onPlaying,
  onClip,
}: APreviewProps) => {
  const [clip, setClip] = useState<VideoSource | null>(null);
  const [showing] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!isShowing) {
      const lettingGo = setTimeout(() => {
        setClip(null);
      }, LETS_GO_AFTER);

      return () => {
        clearTimeout(lettingGo);
      };
    }

    const moved = new AbortController();
    const hasMoved = () => moved.signal.aborted;
    const uri = onThisServer(`/api/media/${mediaId}/preview`);
    const settling = setTimeout(() => {
      void readPreviewState(uri).then(async (state) => {
        if (state !== 'ready' || hasMoved()) {
          return;
        }

        const cookie = await theCookiesThisPhoneHolds(uri);

        if (!hasMoved()) {
          setClip(cookie === null ? { uri } : { uri, headers: { Cookie: cookie } });
        }
      });
    }, SETTLE_FOR);

    return () => {
      moved.abort();
      clearTimeout(settling);
    };
  }, [isShowing, mediaId]);

  const player = useVideoPlayer(clip, (ready) => {
    ready.muted = isMuted;
    ready.loop = false;
    ready.play();
  });
  const moving = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const isPlaying = clip !== null && moving.isPlaying;

  useEffect(() => {
    if (!isShowing) {
      player.pause();
    }
  }, [isShowing, player]);

  useEventListener(player, 'playToEnd', () => {
    onEnded?.();
  });

  useEffect(() => {
    hushThePlayer(player, isMuted);
  }, [player, isMuted]);

  useEffect(() => {
    onPlaying?.(isPlaying);
    Animated.timing(showing, {
      toValue: isPlaying ? 1 : 0,
      duration: FADES_IN_OVER,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isPlaying, showing, onPlaying]);

  useEffect(() => {
    if (onClip === undefined || !isPlaying) {
      return undefined;
    }

    onClip(player);

    return () => {
      onClip(null);
    };
  }, [isPlaying, onClip, player]);

  return (
    <View style={styles.fills} pointerEvents="none">
      {hasBackdrop ? (
        <Image
          style={styles.fills}
          source={{ uri: onThisServer(`/api/media/${mediaId}/image/backdrop`) }}
          accessibilityIgnoresInvertColors
        />
      ) : null}

      {clip === null ? null : (
        <Animated.View style={[styles.fills, { opacity: showing }]}>
          <VideoView
            style={styles.fills}
            player={player}
            nativeControls={false}
            contentFit="cover"
          />
        </Animated.View>
      )}
    </View>
  );
};

APreview.displayName = 'APreview';

export { APreview };
