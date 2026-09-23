import { Info } from '@keyline-icons/react-native';
import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { APreview } from '@ValencePhone/components/APreview/APreview';
import { ASoundSwitch } from '@ValencePhone/components/ASoundSwitch/ASoundSwitch';
import { AScrim } from '@ValencePhone/components/AScrim/AScrim';
import { ATitleLogo } from '@ValencePhone/components/ATitleLogo/ATitleLogo';
import { TheBadges } from '@ValencePhone/components/TheBadges/TheBadges';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { howLongItRuns } from '@ValencePhone/components/ATitle/howLongItRuns';
import { useSoundPreference } from '@ValencePhone/hooks/useSoundPreference';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AFeatureProps } from './AFeature.types';

const TELL_FOR = 8000;

const TALL = 1.3;

const LOGO_HIGH = 76;

const LOGO_AT_MOST = 0.7;

const ARRIVES_FROM = 1.06;

const ARRIVES_OVER = 1100;

const RISES_BY = 14;

const RISES_OVER = 550;

const ONE_AFTER_ANOTHER = 90;

const FOLDS_OVER = 600;

const PARTS = 4;

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  facts: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  folds: { overflow: 'hidden' },
  unfolded: { left: 0, position: 'absolute', right: 0, top: 0 },
  foot: {
    bottom: 0,
    gap: 8,
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 18,
    position: 'absolute',
    right: 0,
  },
  moreInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    flexDirection: 'row',
    flexGrow: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sound: { position: 'absolute', right: 6, top: 6 },
  whole: { borderRadius: 20, overflow: 'hidden' },
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
 * @param onClip - Told its clip's player while it plays, so the page can draw it behind itself.
 */
const AFeature = ({
  media,
  width,
  isShowing,
  resumeAt,
  onEnded,
  onPlay,
  onMoreInfo,
  onClip,
}: AFeatureProps) => {
  const colours = useTheColours();
  const detail = useQuery(libraryQueries.detail(media.id));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTelling, setIsTelling] = useState(true);
  const { isMuted, toggle } = useSoundPreference();
  const [arriving] = useState(() => new Animated.Value(ARRIVES_FROM));
  const [rising] = useState(() => Array.from({ length: PARTS }, () => new Animated.Value(0)));
  const [telling] = useState(() => new Animated.Value(1));
  const [toldHigh, setToldHigh] = useState<number | null>(null);
  const title = media.seriesTitle ?? media.title;
  const overview = detail.data?.metadata.overview ?? null;

  useEffect(() => {
    if (!isShowing) {
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

    telling.setValue(1);

    const folding = setTimeout(() => {
      Animated.timing(telling, {
        toValue: 0,
        duration: FOLDS_OVER,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        setIsTelling(false);
      });
    }, TELL_FOR);

    return () => {
      clearTimeout(folding);
    };
  }, [isShowing, media.id, arriving, rising, telling]);

  /**
   * How one part of the foot rises into view, in its turn.
   *
   * @param part - Which part, counting up from the logo.
   * @returns Its fade and rise.
   */
  const risingOf = (part: number) => {
    const value = rising[part] ?? telling;

    return {
      opacity: value,
      transform: [
        { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [RISES_BY, 0] }) },
      ],
    };
  };

  const facts = [
    media.rating === null || media.rating === undefined ? null : `★ ${media.rating.toFixed(1)}`,
    media.year === null ? null : media.year.toString(),
    media.seriesTitle === null || media.seriesTitle === undefined
      ? howLongItRuns(media.durationSeconds)
      : 'Series',
    (media.genres ?? []).length === 0 ? null : (media.genres ?? []).slice(0, 2).join(', '),
  ].filter((fact) => fact !== null);

  return (
    <Button tone="bare" label={title} onPress={onMoreInfo}>
      <View
        style={[
          styles.whole,
          { backgroundColor: colours.surfaceRaised, height: width * TALL, width },
        ]}
      >
        <Animated.View style={[styles.fills, { transform: [{ scale: arriving }] }]}>
          <APreview
            mediaId={media.id}
            hasBackdrop={media.hasBackdrop}
            isShowing={isShowing}
            isMuted={isMuted}
            onEnded={onEnded}
            onPlaying={setIsPlaying}
            {...(onClip === undefined ? {} : { onClip })}
          />
        </Animated.View>

        <AScrim />

        {isPlaying ? (
          <View style={styles.sound}>
            <ASoundSwitch isMuted={isMuted} onToggle={toggle} />
          </View>
        ) : null}

        <View style={styles.foot}>
          <Animated.View style={risingOf(0)}>
            <ATitleLogo
              mediaId={media.hasLogo ? media.id : null}
              title={title}
              high={LOGO_HIGH}
              widest={width * LOGO_AT_MOST}
              isOnArtwork
            />
          </Animated.View>

          <Animated.View style={[styles.facts, risingOf(1)]}>
            <Words size="small" tone="onArtwork">
              {facts.join(' · ')}
            </Words>
            <TheBadges
              isOnArtwork
              isShort
              badges={qualityBadges({
                width: media.width,
                height: media.height,
                videoRange: media.videoRange,
                audioStreams: detail.data?.audioStreams,
              })}
            />
          </Animated.View>

          {overview === null || overview === '' || !isTelling ? null : (
            <Animated.View
              style={[
                styles.folds,
                {
                  opacity: telling,
                  ...(toldHigh === null
                    ? {}
                    : {
                        height: telling.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, toldHigh],
                        }),
                      }),
                },
              ]}
            >
              <View
                style={styles.unfolded}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;

                  if (height > 0 && toldHigh !== height) {
                    setToldHigh(height);
                  }
                }}
              >
                <Animated.View style={risingOf(2)}>
                  <Words tone="onArtwork" lines={3} isProse>
                    {overview}
                  </Words>
                </Animated.View>
              </View>
            </Animated.View>
          )}

          <Animated.View style={[styles.buttons, risingOf(3)]}>
            <Button tone="bright" icon={PlayFilled} onPress={onPlay}>
              {resumeAt === null ? 'Play' : `Resume ${howLongItRuns(resumeAt)}`}
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
