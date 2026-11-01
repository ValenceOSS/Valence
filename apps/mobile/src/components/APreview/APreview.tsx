import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { useEffect, useRef, useState } from 'react';
import { useEvent, useEventListener } from 'expo';
import { Animated, StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { useVideoPlayer, VideoView } from 'expo-video';
import { readClipFraming } from '@ValenceClient/playback/readClipFraming';
import type { ClipFraming } from '@ValenceClient/playback/ClipFraming';
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

const NOT_WORTH_ZOOMING = 1.01;

const FRAMING_ASKED_EVERY = 3000;

const FRAMING_ASKED_AT_MOST = 5;

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
 *   clip behind itself without playing it twice; and who to tell whether its clip is being found,
 *   has been found, or is not coming.
 *
 * Where the server has measured the black bars a clip is letterboxed or pillarboxed with, the clip
 * is zoomed and centred so that its picture, not the bars, fills whatever holds it. A clip from
 * elsewhere, such as a trailer, may only be measured once it has been found, so it is asked about
 * again every few seconds while it plays until the measuring is done.
 */
const APreview = (props: APreviewProps) => {
  const { isShowing: isAskedToShow, isMuted, onEnded, onPlaying, onClip, onFinding } = props;
  const isAClip = 'clip' in props;
  const clipAt = 'clip' in props ? props.clip : `/api/media/${props.mediaId}/preview`;
  const isOnTop = useIsOnTop();
  const isOnMobileData = useIsOnMobileData();
  const isShowing = isAskedToShow && isOnTop && !isOnMobileData;
  const [clip, setClip] = useState<VideoSource | null>(null);
  const [framing, setFraming] = useState<ClipFraming | null>(null);
  const [isNotComing, setIsNotComing] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [held, setHeld] = useState<{ wide: number; high: number } | null>(null);
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

    setIsNotComing(false);

    const settling = setTimeout(() => {
      void readClipFraming(uri).then(async ({ state, framing: measured }) => {
        if (hasMoved()) {
          return;
        }

        if (state !== 'ready') {
          setIsNotComing(true);

          return;
        }

        setFraming(measured);

        if (measured === null && isAClip) {
          void (async () => {
            for (let asked = 0; asked < FRAMING_ASKED_AT_MOST; asked += 1) {
              await new Promise((resolve) => {
                setTimeout(resolve, FRAMING_ASKED_EVERY);
              });

              if (hasMoved()) {
                return;
              }

              const again = await readClipFraming(uri);

              if (again.framing !== null && !hasMoved()) {
                setFraming(again.framing);

                return;
              }
            }
          })();
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
  }, [isShowing, clipAt, isAClip]);

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
    if (isPlaying) {
      setHasPlayed(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (onFinding !== undefined && isShowing) {
      onFinding(isNotComing ? 'none' : hasPlayed ? 'found' : 'finding');
    }
  }, [onFinding, isShowing, isNotComing, hasPlayed]);

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
    <View
      style={styles.fills}
      pointerEvents="none"
      onLayout={({ nativeEvent }) => {
        setHeld({ wide: nativeEvent.layout.width, high: nativeEvent.layout.height });
      }}
    >
      {'mediaId' in props && props.hasBackdrop ? (
        <ARemotePicture
          style={styles.fills}
          uri={onThisServer(artworkUrl(props.mediaId, 'backdrop'))}
        />
      ) : null}

      {clip === null ? null : (
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
      )}
    </View>
  );
};

APreview.displayName = 'APreview';

export { APreview };
