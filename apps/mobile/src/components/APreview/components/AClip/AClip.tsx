import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEvent, useEventListener } from 'expo';
import { Animated, StyleSheet } from 'react-native';
import { VideoView } from 'expo-video';
import { hushThePlayer } from '@ValenceMobile/playback/hushThePlayer';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { AClipProps } from './AClip.types';

const FADES_IN_OVER = 700;

const NOT_WORTH_ZOOMING = 1.01;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * A preview's clip, playing in a player that may be shared with other previews and drawn here only
 * while the clip in it is this preview's own: it starts as soon as it has loaded, fades in over the
 * backdrop while it plays and is showing, and once it is no longer showing keeps playing while it
 * fades out, and only then stops, so it never freezes on a frame and vanishes. It stops at once
 * where a page or the player covers it.
 *
 * Where the server has measured the black bars the clip is letterboxed or pillarboxed with, it is
 * zoomed and centred so that its picture, not the bars, fills whatever holds it.
 *
 * @param player - The player the clip is loaded in.
 * @param isShowing - Whether the clip may be seen.
 * @param isOnTop - Whether the page it is on is the one showing, rather than covered by another.
 * @param isMuted - Whether it is silent.
 * @param framing - Where the clip's black bars are, where they were measured.
 * @param held - How big whatever holds it is, once laid out.
 * @param onEnded - Told when it has played through.
 * @param onPlaying - Told whether it is playing, and that it is not once it is no longer drawn.
 * @param onClip - Told the player while the clip plays, and nothing once it stops.
 */
const AClip = ({
  player,
  isShowing,
  isOnTop,
  isMuted,
  framing,
  held,
  onEnded,
  onPlaying,
  onClip,
}: AClipProps) => {
  const [showing] = useState(() => new Animated.Value(0));
  const moving = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const isPlaying = moving.isPlaying;
  const wantsToPlay = useRef(isShowing);

  useLayoutEffect(() => {
    wantsToPlay.current = isShowing;
  }, [isShowing]);

  useEventListener(player, 'sourceLoad', () => {
    if (wantsToPlay.current) {
      player.play();
    }
  });

  useEventListener(player, 'playToEnd', () => {
    onEnded?.();
  });

  useEffect(() => {
    if (isShowing && player.status === 'readyToPlay') {
      player.play();
    }
  }, [isShowing, player]);

  useEffect(() => {
    if (!isOnTop) {
      player.pause();
    }
  }, [isOnTop, player]);

  useEffect(() => {
    hushThePlayer(player, isMuted);
  }, [player, isMuted]);

  useEffect(() => {
    onPlaying(isPlaying);
  }, [isPlaying, onPlaying]);

  useEffect(
    () => () => {
      onPlaying(false);
    },
    [onPlaying],
  );

  useEffect(() => {
    const fading = Animated.timing(showing, {
      toValue: isPlaying && isShowing ? 1 : 0,
      duration: FADES_IN_OVER,
      easing: EASINGS.inOutQuad,
      useNativeDriver: true,
    });

    fading.start(({ finished }) => {
      if (finished && !isShowing) {
        player.pause();
      }
    });

    return () => {
      fading.stop();
    };
  }, [isPlaying, isShowing, showing, player]);

  useEffect(() => {
    if (onClip === undefined || !isPlaying) {
      return undefined;
    }

    onClip(player);

    return () => {
      onClip(null);
    };
  }, [isPlaying, onClip, player]);

  const zoom = (() => {
    if (framing === null || held === null) {
      return null;
    }

    const covers = Math.max(held.wide / framing.wide, held.high / framing.high);
    const litWide = (framing.wide - framing.left - framing.right) * covers;
    const litHigh = (framing.high - framing.top - framing.bottom) * covers;
    const by = Math.max(held.wide / litWide, held.high / litHigh, 1);

    return litWide <= 0 || litHigh <= 0 || by < NOT_WORTH_ZOOMING
      ? null
      : [
          { translateX: (-(framing.left - framing.right) / 2) * covers * by },
          { translateY: (-(framing.top - framing.bottom) / 2) * covers * by },
          { scale: by },
        ];
  })();

  return (
    <Animated.View
      style={[styles.fills, { opacity: showing }, zoom === null ? null : { transform: zoom }]}
    >
      <VideoView
        allowsVideoFrameAnalysis={false}
        style={styles.fills}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
    </Animated.View>
  );
};

AClip.displayName = 'AClip';

export { AClip };
