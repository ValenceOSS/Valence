import { useEffect, useState } from 'react';
import { useEvent, useEventListener } from 'expo';
import { useQuery } from '@tanstack/react-query';
import { Animated, Easing, Image, LayoutAnimation, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Info, Play, Volume2, VolumeX } from 'lucide-react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { readPreviewState } from '@ValenceClient/playback/readPreviewState';
import { readSoundPreference, saveSoundPreference } from '@ValenceClient/playback/soundPreference';
import { AScrim } from '@ValencePhone/components/AScrim/AScrim';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { Words } from '@ValencePhone/components/Words/Words';
import { howLongItRuns } from '@ValencePhone/components/ATitle/howLongItRuns';
import { hushThePlayer } from '@ValencePhone/playback/hushThePlayer';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValencePhone/platform/theCookiesThisPhoneHolds';
import type { VideoSource } from 'expo-video';
import type { AFeatureProps } from './AFeature.types';

const SETTLE_FOR = 2500;

const TELL_FOR = 8000;

const TALL = 1.3;

const LOGO_HIGH = 76;

const LOGO_AT_MOST = 0.7;

const ARRIVES_FROM = 1.06;

const ARRIVES_OVER = 1100;

const FADES_IN_OVER = 700;

const RISES_BY = 14;

const RISES_OVER = 550;

const ONE_AFTER_ANOTHER = 90;

const FOLDS_OVER = 550;

const PARTS = 4;

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  foot: {
    bottom: 0,
    gap: 8,
    left: 0,
    paddingBottom: 22,
    paddingHorizontal: SCREEN_EDGE,
    position: 'absolute',
    right: 0,
  },
  moreInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  play: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sound: { padding: 14, position: 'absolute', right: 6, top: 6 },
  whole: { overflow: 'hidden' },
});

/**
 * One title featured at the head of the library, as the web's hero draws it: its backdrop settling
 * into place as it arrives, and a few seconds later a clip of it fading in over that, darkened and
 * blurred towards the foot where its logo, its facts and a few lines about it rise into view one
 * after another, with a way to play it and a way to read more. The lines about it fold away once
 * they have been read, and what is below them slides up into their place.
 *
 * The clip plays only while the title is the one showing, silent unless somebody turned the sound
 * on, which is remembered for the next.
 *
 * @param media - The title.
 * @param width - How wide to draw it.
 * @param isShowing - Whether it is the one in view.
 * @param resumeAt - Where somebody stopped in it, if they did.
 * @param onEnded - Told when its clip has played through.
 * @param onPlay - Told to play it.
 * @param onMoreInfo - Told to open its page.
 */
const AFeature = ({
  media,
  width,
  isShowing,
  resumeAt,
  onEnded,
  onPlay,
  onMoreInfo,
}: AFeatureProps) => {
  const detail = useQuery(libraryQueries.detail(media.id));
  const [clip, setClip] = useState<VideoSource | null>(null);
  const [isTelling, setIsTelling] = useState(true);
  const [isMuted, setIsMuted] = useState(() => readSoundPreference() === 'muted');
  const [logoWide, setLogoWide] = useState<number | null>(null);
  const [hasNoLogo, setHasNoLogo] = useState(false);
  const [arriving] = useState(() => new Animated.Value(ARRIVES_FROM));
  const [showing] = useState(() => new Animated.Value(0));
  const [rising] = useState(() => Array.from({ length: PARTS }, () => new Animated.Value(0)));
  const title = media.seriesTitle ?? media.title;
  const overview = detail.data?.metadata.overview ?? null;

  useEffect(() => {
    if (!isShowing) {
      setClip(null);
      arriving.setValue(ARRIVES_FROM);
      rising.forEach((part) => {
        part.setValue(0);
      });

      return;
    }

    setIsTelling(true);
    Animated.parallel([
      Animated.timing(arriving, {
        toValue: 1,
        duration: ARRIVES_OVER,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(
        ONE_AFTER_ANOTHER,
        rising.map((part) =>
          Animated.timing(part, {
            toValue: 1,
            duration: RISES_OVER,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();

    const moved = new AbortController();
    const hasMoved = () => moved.signal.aborted;
    const uri = onThisServer(`/api/media/${media.id}/preview`);
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
    const telling = setTimeout(() => {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          FOLDS_OVER,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity,
        ),
      );
      setIsTelling(false);
    }, TELL_FOR);

    return () => {
      moved.abort();
      clearTimeout(settling);
      clearTimeout(telling);
    };
  }, [isShowing, media.id, arriving, rising]);

  const player = useVideoPlayer(clip, (ready) => {
    ready.muted = isMuted;
    ready.loop = false;
    ready.play();
  });
  const moving = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const isPlaying = clip !== null && moving.isPlaying;

  useEventListener(player, 'playToEnd', onEnded);

  useEffect(() => {
    hushThePlayer(player, isMuted);
  }, [player, isMuted]);

  useEffect(() => {
    Animated.timing(showing, {
      toValue: isPlaying ? 1 : 0,
      duration: FADES_IN_OVER,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isPlaying, showing]);

  /**
   * How one part of the foot rises into view, in its turn.
   *
   * @param part - Which part, counting up from the logo.
   * @returns Its fade and rise.
   */
  const risingOf = (part: number) => {
    const value = rising[part] ?? showing;

    return {
      opacity: value,
      transform: [
        { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [RISES_BY, 0] }) },
      ],
    };
  };

  const facts = [
    media.year === null ? null : media.year.toString(),
    media.rating === null || media.rating === undefined ? null : `★ ${media.rating.toFixed(1)}`,
    media.seriesTitle === null || media.seriesTitle === undefined
      ? howLongItRuns(media.durationSeconds)
      : null,
  ].filter((fact) => fact !== null);
  const logoLimit = width * LOGO_AT_MOST;

  return (
    <Button tone="bare" label={title} onPress={onMoreInfo}>
      <View style={[styles.whole, { height: width * TALL, width }]}>
        <Animated.View style={[styles.fills, { transform: [{ scale: arriving }] }]}>
          {media.hasBackdrop ? (
            <Image
              style={styles.fills}
              source={{ uri: onThisServer(`/api/media/${media.id}/image/backdrop`) }}
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
        </Animated.View>

        <AScrim />

        {isPlaying ? (
          <View style={styles.sound}>
            <Button
              tone="bare"
              label={isMuted ? 'Turn the sound on' : 'Turn the sound off'}
              onPress={() => {
                setIsMuted((was) => {
                  saveSoundPreference(was ? 'audible' : 'muted');

                  return !was;
                });
              }}
            >
              <Icon of={isMuted ? VolumeX : Volume2} size={22} colour="#ffffff" />
            </Button>
          </View>
        ) : null}

        <View style={styles.foot}>
          <Animated.View style={risingOf(0)}>
            {media.hasLogo && !hasNoLogo ? (
              <Image
                style={{
                  height: LOGO_HIGH,
                  width: Math.min(logoWide ?? logoLimit, logoLimit),
                }}
                resizeMode="contain"
                source={{ uri: onThisServer(`/api/media/${media.id}/image/logo?at=full`) }}
                accessibilityLabel={title}
                onLoad={(event) => {
                  const { width: wide, height: high } = event.nativeEvent.source;

                  if (high > 0) {
                    setLogoWide((wide / high) * LOGO_HIGH);
                  }
                }}
                onError={() => {
                  setHasNoLogo(true);
                }}
              />
            ) : (
              <Words size="title" tone="onArtwork" lines={2}>
                {title}
              </Words>
            )}
          </Animated.View>

          <Animated.View style={risingOf(1)}>
            <Words size="small" tone="onArtwork">
              {facts.join(' · ')}
            </Words>
          </Animated.View>

          {overview === null || overview === '' || !isTelling ? null : (
            <Animated.View style={risingOf(2)}>
              <Words tone="onArtwork" lines={3}>
                {overview}
              </Words>
            </Animated.View>
          )}

          <Animated.View style={[styles.buttons, risingOf(3)]}>
            <Button tone="bare" label={resumeAt === null ? 'Play' : 'Resume'} onPress={onPlay}>
              <View style={styles.play}>
                <Icon of={Play} size={18} colour="#000000" isFilled />
                <Words tone="onBright">
                  {resumeAt === null ? 'Play' : `Resume from ${howLongItRuns(resumeAt)}`}
                </Words>
              </View>
            </Button>

            <Button tone="bare" label="More info" onPress={onMoreInfo}>
              <View style={styles.moreInfo}>
                <Icon of={Info} size={18} colour="#ffffff" />
                <Words tone="onArtwork">More info</Words>
              </View>
            </Button>
          </Animated.View>
        </View>
      </View>
    </Button>
  );
};

AFeature.displayName = 'AFeature';

export { AFeature };
