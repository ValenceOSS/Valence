import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { useEffect, useRef, useState } from 'react';
import { useEvent, useEventListener } from 'expo';
import { Animated, StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { useVideoPlayer, VideoView } from 'expo-video';
import { readPreviewState } from '@ValenceClient/playback/readPreviewState';
import { hushThePlayer } from '@ValenceMobile/playback/hushThePlayer';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { useIsOnTop } from '@ValenceMobile/hooks/useIsOnTop';
import { useIsOnMobileData } from '@ValenceMobile/components/APreview/useIsOnMobileData';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { VideoPlayer, VideoSource } from 'expo-video';
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
 * server has made one, so scrolling past a title fetches nothing. Once the title is no longer
 * showing the clip keeps playing while it fades into the backdrop, and only then stops, so it never
 * freezes on a frame and vanishes; it stops at once where a page or the player covers it. It is let
 * go a moment after, since the page may be drawing the same clip behind itself and fading it out. On mobile data
 * there is no clip at all, only the backdrop.
 *
 * Something the library does not hold is given where its clip is instead, such as a trailer the
 * server streams, and has no backdrop of its own drawn, since whatever holds it draws one.
 *
 * @param props - Which title it is and whether it has a backdrop to draw until the clip arrives,
 *   or where the clip is; whether it is in view, and so whether its clip may play — which it may
 *   not while another page covers the one it is on, whatever this says; whether the clip is
 *   silent; and who to tell when the clip has played through, when it starts or stops playing, and
 *   of the clip's player while it plays and nothing once it stops, so the page can draw the same
 *   clip behind itself without playing it twice.
 */
const APreview = (props: APreviewProps) => {
  const { isShowing: isAskedToShow, isMuted, onEnded, onPlaying, onClip } = props;
  const clipAt = 'clip' in props ? props.clip : `/api/media/${props.mediaId}/preview`;
  const isOnTop = useIsOnTop();
  const isOnMobileData = useIsOnMobileData();
  const isShowing = isAskedToShow && isOnTop && !isOnMobileData;
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
    const uri = onThisServer(clipAt);
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
  }, [isShowing, clipAt]);

  const player = useVideoPlayer(clip, (ready) => {
    ready.muted = isMuted;
    ready.loop = false;
  });

  useEventListener(player, 'sourceLoad', () => {
    player.play();
  });
  const moving = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const isPlaying = clip !== null && moving.isPlaying;
  const livePlayer = useRef<VideoPlayer | null>(null);

  useEffect(() => {
    livePlayer.current = player;

    return () => {
      livePlayer.current = null;
    };
  }, [player]);

  useEffect(() => {
    if (!isOnTop) {
      player.pause();
    }
  }, [isOnTop, player]);

  useEventListener(player, 'playToEnd', () => {
    onEnded?.();
  });

  useEffect(() => {
    hushThePlayer(player, isMuted);
  }, [player, isMuted]);

  useEffect(() => {
    onPlaying?.(isPlaying);
    Animated.timing(showing, {
      toValue: isPlaying && isShowing ? 1 : 0,
      duration: FADES_IN_OVER,
      easing: EASINGS.inOutQuad,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isShowing && livePlayer.current === player) {
        player.pause();
      }
    });
  }, [isPlaying, isShowing, showing, onPlaying, player]);

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
      {'mediaId' in props && props.hasBackdrop ? (
        <ARemotePicture
          style={styles.fills}
          uri={onThisServer(artworkUrl(props.mediaId, 'backdrop'))}
        />
      ) : null}

      {clip === null ? null : (
        <Animated.View style={[styles.fills, { opacity: showing }]}>
          <VideoView
            allowsVideoFrameAnalysis={false}
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
