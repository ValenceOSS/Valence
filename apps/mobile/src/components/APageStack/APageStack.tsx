import { useLayoutEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { APageStackProps, AStackedPage } from './APageStack.types';

const PUSHED_UNDER = -1;

const IN_PLACE = 0;

const PUSHED_OFF = 1;

const UNDER_SHIFT = 0.3;

const UNDER_DIM = 0.25;

const EDGE = 24;

const GOES_BACK_PAST = 0.35;

const GOES_BACK_FASTER_THAN = 0.5;

const GOES_DOWN_PAST = 0.25;

const MOVE = { ...SPRINGS.liquid, overshootClamping: true, useNativeDriver: true } as const;

const NOTHING_YET = {
  top: null,
  beneath: null,
  width: 0,
  height: 0,
  onBack: () => undefined,
  canSwipe: false,
  canDrop: false,
} as const;

const styles = StyleSheet.create({
  dim: { backgroundColor: '#000000' },
});

/**
 * Where a page stands — in place, pushed off to the right, or pushed under the one above it — made
 * the first time it is asked about.
 *
 * @param places - Every page's place, by key.
 * @param key - The page.
 * @param from - Where a page nobody has placed yet starts.
 * @returns Its place, which moves.
 */
const placeIn = (
  places: Map<string, Animated.Value>,
  key: string,
  from: number = IN_PLACE,
): Animated.Value => {
  const known = places.get(key);

  if (known !== undefined) {
    return known;
  }

  const made = new Animated.Value(from);

  places.set(key, made);

  return made;
};

/**
 * The pages somebody has opened, one over another, moved between as an iPhone moves between them: a
 * page opened slides in from the right while the one beneath it drifts a little left and dims, and
 * going back runs the same the other way. The way back can also be dragged from the left edge, which
 * follows the finger, and goes back or springs home depending on how far and how fast it was let go.
 * A page that holds its edge — a book being read, whose pages are swiped — is left only by its own
 * way back, so a swipe meant to turn a page never closes the book.
 *
 * A page that rises — the music player — comes up from below instead, over a page that stays put,
 * once it has been drawn, so the work of drawing it is not done in the frames it should be moving in,
 * and can be dragged back down from anywhere on it that does not scroll or slide on its own.
 *
 * Every page stays drawn beneath the one on top, so going back returns to it as it was left, scrolled
 * where it was scrolled; only the top one is told it is on top, so the rest can stop playing. Where
 * somebody has asked their phone for less motion, pages cross-fade instead of sliding.
 *
 * @param pages - The pages, bottom first; the first is what everything opens over.
 * @param onBack - Told somebody dragged the top page away.
 */
const APageStack = ({ pages, onBack }: APageStackProps) => {
  const { width, height } = useWindowDimensions();
  const isStill = usePrefersStillness();
  const [places] = useState(() => new Map<string, Animated.Value>());
  const [leaving, setLeaving] = useState<AStackedPage | null>(null);
  const [first] = useState(() => new Set(pages.map((page) => page.key)));
  const [held, setHeld] = useState(pages);
  const before = useRef<readonly AStackedPage[]>(pages);

  if (held !== pages) {
    const gone = held.at(-1) ?? null;

    if (pages.length < held.length && gone !== null && pages.length > 0) {
      setLeaving(gone);
    }

    setHeld(pages);
  }

  const drawn =
    leaving === null || pages.some((page) => page.key === leaving.key)
      ? pages
      : [...pages, leaving];
  const top = drawn.at(-1) ?? null;
  const beneath = drawn.at(-2) ?? null;

  useLayoutEffect(() => {
    first.clear();

    const was = before.current;

    before.current = pages;

    const opened = pages.at(-1) ?? null;
    const under = pages.at(-2) ?? null;

    if (pages.length > was.length && opened !== null) {
      const arriving = placeIn(places, opened.key, PUSHED_OFF);

      if (opened.rises === true) {
        let hasRisen = false;

        const rise = () => {
          hasRisen = true;
          Animated.spring(arriving, { ...MOVE, toValue: IN_PLACE }).start();
        };

        let waiting = requestAnimationFrame(() => {
          waiting = requestAnimationFrame(rise);
        });

        return () => {
          if (!hasRisen) {
            cancelAnimationFrame(waiting);
            rise();
          }
        };
      }

      Animated.spring(arriving, { ...MOVE, toValue: IN_PLACE }).start();

      if (under !== null) {
        Animated.spring(placeIn(places, under.key), { ...MOVE, toValue: PUSHED_UNDER }).start();
      }

      return undefined;
    }

    if (pages.length >= was.length) {
      return undefined;
    }

    const gone = was.at(-1) ?? null;

    for (const page of was.slice(pages.length, -1)) {
      places.delete(page.key);
    }

    if (gone === null) {
      return undefined;
    }

    if (opened === null) {
      places.delete(gone.key);

      return undefined;
    }

    Animated.spring(placeIn(places, opened.key), { ...MOVE, toValue: IN_PLACE }).start();
    Animated.spring(placeIn(places, gone.key), { ...MOVE, toValue: PUSHED_OFF }).start(() => {
      places.delete(gone.key);
      setLeaving((still) => (still?.key === gone.key ? null : still));
    });

    return undefined;
  }, [pages, first, places]);

  const [latest] = useState(
    () =>
      new Map([['now', { top, beneath, width, height, onBack, canSwipe: false, canDrop: false }]]),
  );

  useLayoutEffect(() => {
    latest.set('now', {
      top,
      beneath,
      width,
      height,
      onBack,
      canSwipe:
        top !== null &&
        beneath !== null &&
        top.rises !== true &&
        top.holdsTheEdge !== true &&
        leaving === null,
      canDrop: top !== null && top.rises === true && leaving === null,
    });
  });

  const [dropping] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        latest.get('now')?.canDrop === true &&
        gesture.dy > 8 &&
        gesture.dy > Math.abs(gesture.dx) * 2,
      onPanResponderMove: (_, gesture) => {
        const { top, height } = latest.get('now') ?? NOTHING_YET;

        if (top === null || height === 0) {
          return;
        }

        placeIn(places, top.key).setValue(Math.min(Math.max(gesture.dy / height, 0), 1));
      },
      onPanResponderRelease: (_, gesture) => {
        const { top, height, onBack } = latest.get('now') ?? NOTHING_YET;

        if (top === null || height === 0) {
          return;
        }

        const isGoing = gesture.dy / height > GOES_DOWN_PAST || gesture.vy > GOES_BACK_FASTER_THAN;

        Animated.spring(placeIn(places, top.key), {
          ...MOVE,
          toValue: isGoing ? PUSHED_OFF : IN_PLACE,
        }).start(({ finished }) => {
          if (isGoing && finished) {
            onBack();
          }
        });
      },
      onPanResponderTerminate: () => {
        const { top } = latest.get('now') ?? NOTHING_YET;

        if (top !== null) {
          Animated.spring(placeIn(places, top.key), { ...MOVE, toValue: IN_PLACE }).start();
        }
      },
    }),
  );

  const [swiping] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        latest.get('now')?.canSwipe === true &&
        gesture.x0 < EDGE &&
        gesture.dx > 8 &&
        Math.abs(gesture.dy) < gesture.dx,
      onPanResponderMove: (_, gesture) => {
        const { top, beneath, width } = latest.get('now') ?? NOTHING_YET;

        if (top === null || beneath === null) {
          return;
        }

        const pulled = Math.min(Math.max(gesture.dx / width, 0), 1);

        placeIn(places, top.key).setValue(pulled);
        placeIn(places, beneath.key).setValue(pulled - 1);
      },
      onPanResponderRelease: (_, gesture) => {
        const { top, beneath, width, onBack } = latest.get('now') ?? NOTHING_YET;

        if (top === null || beneath === null) {
          return;
        }

        const isGoing = gesture.dx / width > GOES_BACK_PAST || gesture.vx > GOES_BACK_FASTER_THAN;

        Animated.spring(placeIn(places, beneath.key), {
          ...MOVE,
          toValue: isGoing ? IN_PLACE : PUSHED_UNDER,
        }).start();
        Animated.spring(placeIn(places, top.key), {
          ...MOVE,
          toValue: isGoing ? PUSHED_OFF : IN_PLACE,
        }).start(({ finished }) => {
          if (isGoing && finished) {
            onBack();
          }
        });
      },
      onPanResponderTerminate: () => {
        const { top, beneath } = latest.get('now') ?? NOTHING_YET;

        if (top === null || beneath === null) {
          return;
        }

        Animated.spring(placeIn(places, top.key), { ...MOVE, toValue: IN_PLACE }).start();
        Animated.spring(placeIn(places, beneath.key), { ...MOVE, toValue: PUSHED_UNDER }).start();
      },
    }),
  );

  return (
    <View style={StyleSheet.absoluteFill} {...swiping.panHandlers}>
      <View style={StyleSheet.absoluteFill} {...dropping.panHandlers}>
        {drawn.map((page, index) => {
          const place = placeIn(
            places,
            page.key,
            index === drawn.length - 1
              ? index === 0 || first.has(page.key)
                ? IN_PLACE
                : PUSHED_OFF
              : PUSHED_UNDER,
          );
          const isTop = page.key === (pages.at(-1)?.key ?? null);
          const across = page.rises === true ? height : width;
          const moving = isStill
            ? {
                opacity: place.interpolate({
                  inputRange: [PUSHED_UNDER, IN_PLACE, PUSHED_OFF],
                  outputRange: [1, 1, 0],
                  extrapolate: 'clamp',
                }),
              }
            : {
                transform: [
                  page.rises === true
                    ? {
                        translateY: place.interpolate({
                          inputRange: [IN_PLACE, PUSHED_OFF],
                          outputRange: [0, across],
                          extrapolate: 'clamp',
                        }),
                      }
                    : {
                        translateX: place.interpolate({
                          inputRange: [PUSHED_UNDER, IN_PLACE, PUSHED_OFF],
                          outputRange: [-across * UNDER_SHIFT, 0, across],
                          extrapolate: 'clamp',
                        }),
                      },
                ],
              };

          return (
            <IS_ON_TOP.Provider key={page.key} value={isTop}>
              <Animated.View
                style={[StyleSheet.absoluteFill, moving]}
                pointerEvents={isTop ? 'auto' : 'none'}
                accessibilityElementsHidden={!isTop}
                importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'}
              >
                {page.page}

                {isStill ? null : (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      styles.dim,
                      {
                        opacity: place.interpolate({
                          inputRange: [PUSHED_UNDER, IN_PLACE],
                          outputRange: [UNDER_DIM, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />
                )}
              </Animated.View>
            </IS_ON_TOP.Provider>
          );
        })}
      </View>
    </View>
  );
};

APageStack.displayName = 'APageStack';

export { APageStack };
