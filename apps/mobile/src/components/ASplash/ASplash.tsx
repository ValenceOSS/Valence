import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';
import type { ASplashProps } from './ASplash.types';
import { say } from '@ValenceI18n/say';

const GROUND = { dark: '#1c1c1c', light: '#ffffff' } as const;

const MARK_HIGH = 36;

const WIDER_BY = 624 / 458;

const NAME_SIZE = 38;

const MARK_RISES_MS = 220;

const NAME_PAUSE_MS = 450;

const NAME_AT_MS = MARK_RISES_MS + NAME_PAUSE_MS;

const CARD_OPENS_MS = 1200;

const DONE_AT_MS = NAME_AT_MS + CARD_OPENS_MS;

const INSET = 12;

const SCREEN_ROUND = 62;

const CARD_ROUND = SCREEN_ROUND - INSET;

const LANDS_ROUND = 20;

const LANDS_MS = 650;

const RING_FADES_MS = 300;

const FADES_MS = 260;

const RING_SIZE = 50;

const RING_FROM_THE_FOOT = 64;

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_ROUND,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  clip: { overflow: 'hidden', position: 'absolute' },
  face: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fixed: { position: 'absolute' },
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
 * show the page, the mark flies off to its place on the page, the name fades, and where the home
 * has a featured card the splash card's edges and corners draw in onto it before fading over it.
 * Inset, its corners follow the screen's own, as a card inside a phone's rounded screen should. The mark is held until then,
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
  const [round] = useState(() => new Animated.Value(SCREEN_ROUND));
  const [faceShown] = useState(() => new Animated.Value(1));
  const [drawnIn] = useState(() => new Animated.Value(0));
  const [opening] = useState(() => new Animated.Value(0));
  const [wordWide, setWordWide] = useState(0);
  const [follows] = useState(() => ({
    markShown: Animated.multiply(risen, markHere),
    markRises: risen.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
    left: Animated.multiply(left, -1),
    top: Animated.multiply(top, -1),
  }));
  const scales = useMemo(() => {
    const across = drawnIn.interpolate({
      inputRange: [0, 1],
      outputRange: [1, (width - INSET * 2) / width],
    });
    const down = drawnIn.interpolate({
      inputRange: [0, 1],
      outputRange: [1, (height - INSET * 2) / height],
    });

    return {
      across,
      down,
      backAcross: Animated.divide(1, across),
      backDown: Animated.divide(1, down),
    };
  }, [drawnIn, width, height]);
  const slides = useMemo(
    () => opening.interpolate({ inputRange: [0, 1], outputRange: [wordWide / 2, 0] }),
    [opening, wordWide],
  );
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

    Animated.parallel([
      Animated.timing(drawnIn, {
        toValue: 1,
        duration: isStill ? 0 : CARD_OPENS_MS,
        easing: EASINGS.outEager,
        useNativeDriver: true,
      }),
      isStill
        ? Animated.timing(opening, { toValue: 1, duration: 0, useNativeDriver: true })
        : Animated.spring(opening, {
            toValue: 1,
            stiffness: 260,
            damping: 24,
            mass: 1,
            useNativeDriver: true,
          }),
    ]).start();
  }, [hasLanded, isStill, drawnIn, opening]);

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
      way.release(from ?? { x: 0, y: 0, width: 0, height: 0 });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          markHere.setValue(0);
        });
      });
    };

    if (markAt.current === null) {
      handOn(null);
    } else {
      markAt.current.measureInWindow((x, y, wide, high) => {
        handOn({ x, y, width: wide, height: high });
      });
    }

    Animated.timing(faceShown, {
      toValue: 0,
      duration: FADES_MS,
      easing: EASINGS.outQuad,
      useNativeDriver: true,
    }).start();

    Animated.timing(ground, {
      toValue: 0,
      duration: FADES_MS,
      easing: EASINGS.outQuad,
      useNativeDriver: true,
    }).start();

    const fade = (after: number) =>
      Animated.timing(cardShown, {
        toValue: 0,
        duration: FADES_MS,
        delay: after,
        easing: EASINGS.outQuad,
        useNativeDriver: true,
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

      [top, left, right, bottom].forEach((edge) => {
        edge.setValue(INSET);
      });
      round.setValue(CARD_ROUND);

      Animated.parallel([
        ...[top, left, right, bottom].map((edge, at) =>
          Animated.timing(edge, {
            toValue: to[at] ?? 0,
            duration: LANDS_MS,
            easing: EASINGS.outEager,
            useNativeDriver: false,
          }),
        ),
        Animated.timing(round, {
          toValue: LANDS_ROUND,
          duration: LANDS_MS,
          easing: EASINGS.outEager,
          useNativeDriver: false,
        }),
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
    faceShown,
    round,
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

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: cardShown }]}>
        <Animated.View style={[styles.clip, { borderRadius: round, bottom, left, right, top }]}>
          <Animated.View
            style={[styles.fixed, { height, left: follows.left, top: follows.top, width }]}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colours.surface,
                  transform: [{ scaleX: scales.across }, { scaleY: scales.down }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.face,
                  {
                    opacity: faceShown,
                    transform: [{ scaleX: scales.backAcross }, { scaleY: scales.backDown }],
                  },
                ]}
              >
                <Animated.View style={[styles.row, { transform: [{ translateX: slides }] }]}>
                  <Animated.View
                    ref={markAt}
                    collapsable={false}
                    style={{
                      opacity: follows.markShown,
                      transform: [{ translateY: follows.markRises }],
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
                    before={13}
                    onWide={setWordWide}
                    style={{
                      color: colours.text,
                      fontFamily: FONTS.sans.regular,
                      fontSize: NAME_SIZE,
                      letterSpacing: NAME_SIZE * -0.03,
                    }}
                  />
                </Animated.View>

                <Animated.View
                  style={[styles.ring, { bottom: RING_FROM_THE_FOOT, opacity: ringShown }]}
                >
                  <ARing
                    colour={withAlpha(colours.text, 0.4)}
                    size={RING_SIZE}
                    isFinishing={isReady}
                    onFilled={ringFilled}
                  />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

ASplash.displayName = 'ASplash';

export { ASplash };
