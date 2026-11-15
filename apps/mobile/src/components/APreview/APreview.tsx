import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { AClip } from '@ValenceMobile/components/APreview/components/AClip/AClip';
import { useClipPlayer } from '@ValenceMobile/components/APreview/useClipPlayer';
import { keepsUpWithPreviews } from '@ValenceMobile/platform/keepsUpWithPreviews';
import { readClipFraming } from '@ValenceClient/playback/readClipFraming';
import type { ClipFraming } from '@ValenceClient/playback/ClipFraming';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { useIsOnTop } from '@ValenceMobile/hooks/useIsOnTop';
import { useArtworkSize } from '@ValenceMobile/hooks/useArtworkSize';
import { useIsOnMobileData } from '@ValenceMobile/components/APreview/useIsOnMobileData';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { VideoSource } from 'expo-video';
import type { AClipPlayer, APreviewProps } from './APreview.types';

const SETTLE_FOR = 2500;

const FRAMING_ASKED_EVERY = 3000;

const FRAMING_ASKED_AT_MOST = 5;

const LETS_GO_AFTER = 1000;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * A preview drawn with the player it was given, or with none at all.
 *
 * @param props - What the preview is, and the player to play its clip in, or nothing for the
 *   backdrop alone.
 */
const ThePreview = (props: APreviewProps & { clipPlayer: AClipPlayer | null }) => {
  const {
    clipPlayer,
    isShowing: isAskedToShow,
    isMuted,
    onEnded,
    onPlaying,
    onClip,
    onFinding,
  } = props;
  const isAClip = 'clip' in props;
  const clipAt = 'clip' in props ? props.clip : `/api/media/${props.mediaId}/preview`;
  const isOnTop = useIsOnTop();
  const isOnMobileData = useIsOnMobileData();
  const isStill = usePrefersStillness();
  const window = useWindowDimensions();
  const backdropSize = useArtworkSize(Math.max(window.width, window.height));
  const isRuledOut = isOnMobileData || isStill || !keepsUpWithPreviews();
  const isShowing = isAskedToShow && isOnTop && !isRuledOut && clipPlayer !== null;
  const [clip, setClip] = useState<VideoSource | null>(null);
  const [framing, setFraming] = useState<ClipFraming | null>(null);
  const [isNotComing, setIsNotComing] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isClipPlaying, setIsClipPlaying] = useState(false);
  const [held, setHeld] = useState<{ wide: number; high: number } | null>(null);
  const load = clipPlayer?.load;
  const letGo = clipPlayer?.letGo;
  const isMine = clip !== null && clipPlayer !== null && clipPlayer.source === clip;
  const isPlaying = isMine && isClipPlaying;

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
          setClip((was) =>
            was !== null &&
            typeof was === 'object' &&
            was.uri === uri &&
            (was.headers?.['Cookie'] ?? null) === cookie
              ? was
              : cookie === null
                ? { uri }
                : { uri, headers: { Cookie: cookie } },
          );
        }
      });
    }, SETTLE_FOR);

    return () => {
      moved.abort();
      clearTimeout(settling);
    };
  }, [isShowing, clipAt, isAClip]);

  useEffect(() => {
    if (clip === null || load === undefined || letGo === undefined) {
      return undefined;
    }

    load(clip);

    return () => {
      letGo(clip);
    };
  }, [clip, load, letGo]);

  useEffect(() => {
    onPlaying?.(isPlaying);
  }, [isPlaying, onPlaying]);

  useEffect(() => {
    if (isPlaying) {
      setHasPlayed(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (onFinding !== undefined && isAskedToShow && isOnTop) {
      onFinding(isRuledOut || isNotComing ? 'none' : hasPlayed ? 'found' : 'finding');
    }
  }, [onFinding, isAskedToShow, isOnTop, isRuledOut, isNotComing, hasPlayed]);

  const heardPlaying = useCallback((isNowPlaying: boolean) => {
    setIsClipPlaying(isNowPlaying);
  }, []);

  return (
    <View
      style={styles.fills}
      pointerEvents="none"
      onLayout={({ nativeEvent }) => {
        setHeld({ wide: nativeEvent.layout.width, high: nativeEvent.layout.height });
      }}
    >
      {'mediaId' in props && props.hasBackdrop && backdropSize !== null ? (
        <ARemotePicture
          style={styles.fills}
          uri={onThisServer(
            artworkUrl(
              props.mediaId,
              'backdrop',
              backdropSize === 'whole' ? {} : { size: backdropSize },
            ),
          )}
        />
      ) : null}

      {isMine ? (
        <AClip
          player={clipPlayer.player}
          isShowing={isShowing}
          isOnTop={isOnTop}
          isMuted={isMuted}
          framing={framing}
          held={held}
          onPlaying={heardPlaying}
          {...(onEnded === undefined ? {} : { onEnded })}
          {...(onClip === undefined ? {} : { onClip })}
        />
      ) : null}
    </View>
  );
};

/**
 * A preview with a player of its own, made for it and let go with it.
 *
 * @param props - What the preview is.
 */
const WithItsOwnPlayer = (props: APreviewProps) => {
  const clipPlayer = useClipPlayer();

  return <ThePreview {...props} clipPlayer={clipPlayer} />;
};

/**
 * A title's backdrop, narrowed to the screen it is drawn on, and a few seconds after it is on screen
 * a clip of the title fading in over it, as the web draws the head of a title: filling whatever
 * holds it, cropped to cover it.
 *
 * The clip is only asked for once the title has been on screen for a moment and only where the
 * server has made one, so scrolling past a title fetches nothing. Once the title is no longer
 * showing the clip fades into the backdrop before it stops, and is let go a moment after. On mobile
 * data, on a phone too slight to keep up with a clip, and for somebody who has asked their phone for
 * less motion, there is no clip at all, only the backdrop, and whoever asked whether one is being
 * found is told none is coming.
 *
 * A preview is given the player to play its clip in where several share one, as the featured titles
 * do, so only one is ever made however many previews there are; given none, it draws its backdrop
 * alone; and left without, it makes one of its own.
 *
 * Something the library does not hold is given where its clip is instead, such as a trailer the
 * server streams, and has no backdrop of its own drawn, since whatever holds it draws one. A clip
 * from elsewhere may only be measured for its black bars once it has been found, so it is asked
 * about again every few seconds while it plays until the measuring is done.
 *
 * @param props - Which title it is and whether it has a backdrop to draw until the clip arrives,
 *   or where the clip is; whether it is in view, and so whether its clip may play — which it may
 *   not while another page covers the one it is on, whatever this says; whether the clip is
 *   silent; the player to play it in, if it is shared; and who to tell when the clip has played
 *   through, when it starts or stops playing, of the clip's player while it plays and nothing once
 *   it stops, and whether its clip is being found, has been found, or is not coming.
 */
const APreview = (props: APreviewProps) =>
  props.clipPlayer === undefined ? (
    <WithItsOwnPlayer {...props} />
  ) : (
    <ThePreview {...props} clipPlayer={props.clipPlayer} />
  );

APreview.displayName = 'APreview';

export { APreview };
