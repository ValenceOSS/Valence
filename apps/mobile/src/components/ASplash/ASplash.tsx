import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ComponentRef } from 'react';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import mark from '@ValenceMobile/assets/valence-mark.png';
import { ARing } from '@ValenceMobile/components/ASpinner/components/ARing/ARing';
import { THE_MARKS_PLACE } from '@ValenceMobile/components/ACarriedMark/THE_MARKS_PLACE';
import { AWordOpening } from '@ValenceMobile/components/ASplash/components/AWordOpening/AWordOpening';
import { THE_SPLASH_LANDS } from '@ValenceMobile/components/ASplash/THE_SPLASH_LANDS';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import { theColours } from '@ValenceMobile/theme/theColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';
import type { ASplashProps } from './ASplash.types';
import { say } from '@ValenceI18n/say';

const GROUND = { dark: '#1c1c1c', light: '#ffffff' } as const;

const MARK_HIGH = 56;

const WIDER_BY = 624 / 458;

const NAME_SIZE = 60;

const MARK_RISES_MS = 220;

const NAME_PAUSE_MS = 450;

const NAME_AT_MS = MARK_RISES_MS + NAME_PAUSE_MS;

const CARD_OPENS_MS = 1200;

const DONE_AT_MS = NAME_AT_MS + CARD_OPENS_MS;

const INSET = 12;

const CARD_ROUND = 20;

const LANDS_MS = 650;

const RING_FADES_MS = 300;

const FADES_MS = 260;

const RING_SIZE = 50;

const RING_FROM_THE_FOOT = 64;

const styles = StyleSheet.create({
  card: { overflow: 'hidden', position: 'absolute' },
  face: { alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  mark: { height: MARK_HIGH, width: MARK_HIGH * WIDER_BY },
  ring: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
  row: { alignItems: 'center', flexDirection: 'row' },
});

/**
 * What Valence shows as it opens, a copy of the web's: Valence's mark rises into place on a card
 * filling the screen, and after a beat the name opens out beside it letter by letter while the
 * card's edges draw in from the edges of the screen and its corners round. A ring at the foot
 * fills and turns while the first screen is got ready, then fills the rest of the way quickly and
 * fades.
 *
 * Once everything has arrived and the first screen is ready, the ground around the card fades to
 * show the page, the mark flies off to its place on the page, and where the home has a featured
 * card the splash card's edges draw in onto it before fading over it. The mark is held until then,
 * so the page's own mark waits for it rather than showing twice.
 *
 * @param isReady - Whether the first screen is ready to be seen.
 * @param isDark - Whether it is drawn dark.
 * @param onGone - Told once it has finished leaving, so it can be taken off the screen.
 */
const ASplash = ({ isReady, isDark, onGone }: ASplashProps) => {
  const { width, height } = useWindowDimensions();
  const isStill = usePrefersStillness();
  const way = useContext(THE_MARKS_PLACE);
  const colours = theColours[isDark ? 'dark' : 'light'];
  const [hasLanded, setHasLanded] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isRingFull, setIsRingFull] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [risen] = useState(() => new Animated.Value(0));
  const [markHere] = useState(() => new Animated.Value(1));
  const [ringShown] = useState(() => new Animated.Value(1));
  const [ground] = useState(() => new Animated.Value(1));
  const [cardShown] = useState(() => new Animated.Value(1));
  const [top] = useState(() => new Animated.Value(0));
  const [left] = useState(() => new Animated.Value(0));
  const [right] = useState(() => new Animated.Value(0));
  const [bottom] = useState(() => new Animated.Value(0));
  const [round] = useState(() => new Animated.Value(0));
  const markAt = useRef<ComponentRef<typeof View>>(null);
  const hasLeft = useRef(false);

  const ringFilled = useCallback(() => {
    setIsRingFull(true);
  }, []);

  useEffect(() => {
    way.hold();
  }, [way]);

  useEffect(() => {
    Animated.timing(risen, {
      toValue: 1,
      duration: isStill ? 0 : MARK_RISES_MS,
      easing: EASINGS.outQuad,
      useNativeDriver: true,
    }).start();

    const lands = setTimeout(
      () => {
        setHasLanded(true);
      },
      isStill ? 0 : NAME_AT_MS,
    );
    const arrives = setTimeout(
      () => {
        setHasArrived(true);
      },
      isStill ? 0 : DONE_AT_MS,
    );

    return () => {
      clearTimeout(lands);
      clearTimeout(arrives);
    };
  }, [isStill, risen]);

  useEffect(() => {
    if (!hasLanded) {
      return;
    }

    Animated.parallel(
      [top, left, right, bottom, round].map((edge, at) =>
        Animated.timing(edge, {
          toValue: at === 4 ? CARD_ROUND : INSET,
          duration: isStill ? 0 : CARD_OPENS_MS,
          easing: EASINGS.outEager,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [hasLanded, isStill, top, left, right, bottom, round]);

  useEffect(() => {
    if (!isRingFull) {
      return;
    }

    Animated.timing(ringShown, {
      toValue: 0,
      duration: isStill ? 0 : RING_FADES_MS,
      easing: EASINGS.outQuad,
      useNativeDriver: true,
    }).start();
  }, [isRingFull, isStill, ringShown]);

  useEffect(() => {
    if (!hasArrived || !isRingFull) {
      return undefined;
    }

    const lets = setTimeout(
      () => {
        setIsLeaving(true);
      },
      isStill ? 0 : RING_FADES_MS,
    );

    return () => {
      clearTimeout(lets);
    };
  }, [hasArrived, isRingFull, isStill]);

  useEffect(() => {
    if (!isLeaving || hasLeft.current) {
      return;
    }

    hasLeft.current = true;

    const handOn = (from: ARectOnScreen | null) => {
      markHere.setValue(0);
      way.release(from ?? { x: 0, y: 0, width: 0, height: 0 });
    };

    if (markAt.current === null) {
      handOn(null);
    } else {
      markAt.current.measureInWindow((x, y, wide, high) => {
        handOn({ x, y, width: wide, height: high });
      });
    }

    Animated.timing(ground, {
      toValue: 0,
      duration: FADES_MS,
      easing: EASINGS.outQuad,
      useNativeDriver: false,
    }).start();

    const fade = (after: number) =>
      Animated.timing(cardShown, {
        toValue: 0,
        duration: FADES_MS,
        delay: after,
        easing: EASINGS.outQuad,
        useNativeDriver: false,
      });

    const land = (target: ARectOnScreen | null) => {
      const isOnScreen = target !== null && target.y < height && target.height > 0 && !isStill;

      if (!isOnScreen) {
        fade(0).start(onGone);

        return;
      }

      const to = [
        Math.max(0, target.y),
        Math.max(0, target.x),
        Math.max(0, width - target.x - target.width),
        Math.max(0, height - target.y - target.height),
      ];

      Animated.parallel([
        ...[top, left, right, bottom].map((edge, at) =>
          Animated.timing(edge, {
            toValue: to[at] ?? 0,
            duration: LANDS_MS,
            easing: EASINGS.outEager,
            useNativeDriver: false,
          }),
        ),
        fade(LANDS_MS),
      ]).start(onGone);
    };

    if (THE_SPLASH_LANDS.measure === null) {
      land(null);
    } else {
      void THE_SPLASH_LANDS.measure().then(land, () => {
        land(null);
      });
    }
  }, [
    isLeaving,
    way,
    markHere,
    ground,
    cardShown,
    top,
    left,
    right,
    bottom,
    width,
    height,
    isStill,
    onGone,
  ]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={isLeaving ? 'none' : 'auto'}
      accessibilityRole="progressbar"
      accessibilityLabel={say('common.loading')}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: GROUND[isDark ? 'dark' : 'light'], opacity: ground },
        ]}
      />

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colours.surface,
            borderRadius: round,
            bottom,
            left,
            opacity: cardShown,
            right,
            top,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.face,
            {
              height,
              left: Animated.multiply(left, -1),
              top: Animated.multiply(top, -1),
              width,
            },
          ]}
        >
          <View style={styles.row}>
            <Animated.View
              ref={markAt}
              collapsable={false}
              style={{
                opacity: Animated.multiply(risen, markHere),
                transform: [
                  { translateY: risen.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                ],
              }}
            >
              <Image
                source={mark}
                resizeMode="contain"
                accessibilityRole="image"
                accessibilityLabel={say('common.valence')}
                style={[styles.mark, { tintColor: colours.text }]}
              />
            </Animated.View>

            <AWordOpening
              word={say('common.valence')}
              isShown={hasLanded}
              isStill={isStill}
              before={20}
              style={{
                color: colours.text,
                fontFamily: FONTS.sans.regular,
                fontSize: NAME_SIZE,
                letterSpacing: NAME_SIZE * -0.03,
              }}
            />
          </View>

          <Animated.View style={[styles.ring, { bottom: RING_FROM_THE_FOOT, opacity: ringShown }]}>
            <ARing
              colour={withAlpha(colours.text, 0.4)}
              size={RING_SIZE}
              isFinishing={isReady}
              onFilled={ringFilled}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

ASplash.displayName = 'ASplash';

export { ASplash };
