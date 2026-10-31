import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CARD_GOES_BACK } from '@ValenceMobile/components/APageStack/CARD_GOES_BACK';
import { CARD_SCROLL } from '@ValenceMobile/components/APageStack/CARD_SCROLL';
import { IS_A_CARD } from '@ValenceMobile/components/APageStack/IS_A_CARD';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
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

const GOES_DOWN_PAST = 0.35;

const GOES_DOWN_FASTER_THAN = 1;

const CARD_GAP = 10;

const CARD_CORNER = 38;

const UNDER_A_CARD_SCALE = 0.92;

const UNDER_A_CARD_DIM = 0.4;

const SWAPPED_SHIFT = 0.3;

const GRABBER_WIDE = 56;

const GRABBER_HIGH = 5;

const KEPT_BENEATH = 2;

const MOVE = { ...SPRINGS.liquid, overshootClamping: true, useNativeDriver: true } as const;

const NOTHING_YET = {
  top: null,
  beneath: null,
  width: 0,
  height: 0,
  onBack: () => undefined,
  onStepBack: undefined,
  canSwipe: false,
  canDrop: false,
} as const;

const styles = StyleSheet.create({
  card: {
    borderTopLeftRadius: CARD_CORNER,
    borderTopRightRadius: CARD_CORNER,
    overflow: 'hidden',
  },
  dim: { backgroundColor: '#000000' },
  hidden: { opacity: 0 },
  grabber: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: GRABBER_HIGH / 2,
    height: GRABBER_HIGH,
    position: 'absolute',
    top: 6,
    width: GRABBER_WIDE,
  },
  lifted: {
    shadowColor: '#000000',
    shadowOffset: { height: 0, width: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  underACard: { borderRadius: CARD_CORNER, overflow: 'hidden' },
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
 * A page drawn as a card — a title — rises from below to stop just short of the status bar, its top
 * corners rounded, while the page it opened over shrinks back and dims beneath it, as a sheet does on
 * an iPhone; dragging it down follows the finger and lets the page beneath grow back with it. A card
 * swapped for another keeps its place, and its content slides across inside it: the new one in from
 * the right going deeper, the old one away to the right coming back. A small pill at its top says it
 * can be dragged down.
 *
 * A page swapped for another in its place — a title found already in the library, opened in place of
 * the page that would have asked for it — takes over where the one it replaced stood, sliding in if
 * that one still was, rather than starting again off to the side.
 *
 * Every page stays drawn beneath the one on top, so going back returns to it as it was left, scrolled
 * where it was scrolled; only the top one is told it is on top, so the rest can stop playing. Where
 * somebody has asked their phone for less motion, pages cross-fade instead of sliding.
 *
 * @param pages - The pages, bottom first; the first is what everything opens over.
 * @param onBack - Told somebody dragged the top page away.
 * @param onStepBack - Told somebody swiped a card back to the one it took the place of, which a card
 *   can be swiped back to only where this is given.
 */
const APageStack = ({ pages, onBack, onStepBack }: APageStackProps) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const [places] = useState(() => new Map<string, Animated.Value>());
  const [scrolls] = useState(() => new Map<string, boolean>());
  const [grabbedAt] = useState(() => ({ dy: 0 }));
  const [leaving, setLeaving] = useState<AStackedPage | null>(null);
  const [first] = useState(() => new Set(pages.map((page) => page.key)));
  const [held, setHeld] = useState(pages);
  const [slots] = useState(() => new Map<string, string>());
  const [swapping] = useState(() => new Animated.Value(1));
  const [swap, setSwap] = useState<{
    gone: AStackedPage;
    toKey: string;
    isForward: boolean;
  } | null>(null);
  const before = useRef<readonly AStackedPage[]>(pages);
  const [peeling] = useState(() => new Animated.Value(0));
  const [peeled, setPeeled] = useState<string | null>(null);

  if (held !== pages) {
    const gone = held.at(-1) ?? null;
    const arrived = pages.at(-1) ?? null;

    if (pages.length < held.length && gone !== null && pages.length > 0) {
      setLeaving(gone);
    }

    if (
      pages.length === held.length &&
      gone !== null &&
      arrived !== null &&
      gone.key !== arrived.key
    ) {
      const place = places.get(gone.key);

      if (place !== undefined) {
        places.set(arrived.key, place);
        places.delete(gone.key);
      }

      if (gone.isCard === true && arrived.isCard === true) {
        slots.set(arrived.key, slots.get(gone.key) ?? gone.key);

        if (peeled === gone.key) {
          setPeeled(null);
        } else {
          setSwap({
            gone,
            toKey: arrived.key,
            isForward: (arrived.depth ?? 0) > (gone.depth ?? 0),
          });
        }
      }
    }

    setHeld(pages);
  }

  /**
   * Draws a page as a card draws it: without the clock's room at its top, told it is a card and
   * whether it goes back to another, able to say when it is scrolled to its top, and able to hand
   * the card a finger that scrolled it there and kept pulling.
   *
   * @param page - The page.
   * @returns The page inside all a card tells it.
   */
  const inACard = (page: AStackedPage): ReactNode => (
    <IS_A_CARD.Provider value>
      <CARD_GOES_BACK.Provider value={page.goesBack === true}>
        <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
          <CARD_SCROLL.Provider
            value={{
              atTop: (isAtTop) => {
                scrolls.set(page.key, isAtTop);
              },
              pullDown,
              letGo,
            }}
          >
            {page.page}
          </CARD_SCROLL.Provider>
        </SafeAreaInsetsContext.Provider>
      </CARD_GOES_BACK.Provider>
    </IS_A_CARD.Provider>
  );

  /**
   * Draws a card's pages: the one it shows; the last few it took the place of, kept drawn but hidden
   * beneath it, so going back finds them as they were left, scrolled where they were scrolled, while
   * any further back are drawn afresh when gone back to, so a long run stays light; and
   * while it is swapping one card's worth for another, the one leaving too — the new one sliding in over the old from the right going forward, and the
   * old one sliding away to the right over the one coming back.
   *
   * @param page - The card's page now.
   * @returns Its layers.
   */
  const cardLayers = (page: AStackedPage): ReactNode => {
    const isSwapping = swap !== null && swap.toKey === page.key;
    const trail = (page.trail ?? [])
      .slice(-KEPT_BENEATH)
      .filter((one) => !isSwapping || one.key !== swap.gone.key);
    const layers = !isSwapping
      ? [...trail, page]
      : swap.isForward
        ? [...trail, swap.gone, page]
        : [...trail, page, swap.gone];

    const isPeeled = !isSwapping && peeled === page.key;
    const peeledTo = isPeeled ? (trail.at(-1)?.key ?? null) : null;

    return layers.map((layer) => {
      const isGoing = isSwapping && layer.key === swap.gone.key;
      const isOnTop = isSwapping
        ? swap.isForward
          ? !isGoing
          : isGoing
        : isPeeled && layer.key === page.key;
      const isMoving = isSwapping && (isGoing || layer.key === page.key);
      const isPeeling = isPeeled && (layer.key === page.key || layer.key === peeledTo);
      const isHidden = layer.key !== page.key && !isMoving && !isPeeling;
      const motion = isHidden
        ? styles.hidden
        : isPeeling
          ? isStill
            ? layer.key === page.key
              ? { opacity: peeling.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }
              : null
            : {
                transform: [
                  {
                    translateX: peeling.interpolate({
                      inputRange: [0, 1],
                      outputRange:
                        layer.key === page.key ? [0, width] : [-width * SWAPPED_SHIFT, 0],
                    }),
                  },
                ],
              }
          : !isMoving
            ? null
            : isStill
              ? {
                  opacity: swapping.interpolate({
                    inputRange: [0, 1],
                    outputRange: isGoing ? [1, 0] : [0, 1],
                  }),
                }
              : {
                  transform: [
                    {
                      translateX: swapping.interpolate({
                        inputRange: [0, 1],
                        outputRange: swap.isForward
                          ? isGoing
                            ? [0, -width * SWAPPED_SHIFT]
                            : [width, 0]
                          : isGoing
                            ? [0, width]
                            : [-width * SWAPPED_SHIFT, 0],
                      }),
                    },
                  ],
                };

      return (
        <Animated.View
          key={layer.key}
          style={[StyleSheet.absoluteFill, motion, isOnTop && styles.lifted]}
          pointerEvents={
            isGoing || isHidden || (isPeeling && layer.key !== page.key) ? 'none' : 'auto'
          }
          accessibilityElementsHidden={isHidden}
          importantForAccessibility={isHidden ? 'no-hide-descendants' : 'auto'}
        >
          <IS_ON_TOP.Provider value={!isHidden && (pages.at(-1)?.key ?? null) === page.key}>
            {inACard(layer)}
          </IS_ON_TOP.Provider>
        </Animated.View>
      );
    });
  };

  const drawn =
    leaving === null || pages.some((page) => page.key === leaving.key)
      ? pages
      : [...pages, leaving];
  const top = drawn.at(-1) ?? null;
  const beneath = drawn.at(-2) ?? null;

  useLayoutEffect(() => {
    if (swap === null) {
      return;
    }

    swapping.setValue(0);
    Animated.spring(swapping, { ...MOVE, toValue: 1 }).start(({ finished }) => {
      if (finished) {
        setSwap(null);
      }
    });
  }, [swap, swapping]);

  useLayoutEffect(() => {
    first.clear();

    const was = before.current;

    before.current = pages;

    const opened = pages.at(-1) ?? null;
    const under = pages.at(-2) ?? null;

    if (pages.length > was.length && opened !== null) {
      const arriving = placeIn(places, opened.key, PUSHED_OFF);

      if (opened.rises === true || opened.isCard === true) {
        let hasRisen = false;

        const rise = () => {
          hasRisen = true;
          Animated.spring(arriving, { ...MOVE, toValue: IN_PLACE }).start();

          if (opened.isCard === true && under !== null) {
            Animated.spring(placeIn(places, under.key), { ...MOVE, toValue: PUSHED_UNDER }).start();
          }
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

    if (pages.length === was.length && opened !== null && opened.key !== was.at(-1)?.key) {
      Animated.spring(placeIn(places, opened.key), { ...MOVE, toValue: IN_PLACE }).start();

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
      new Map([
        [
          'now',
          { top, beneath, width, height, onBack, onStepBack, canSwipe: false, canDrop: false },
        ],
      ]),
  );

  useLayoutEffect(() => {
    latest.set('now', {
      top,
      beneath,
      width,
      height,
      onBack,
      onStepBack,
      canSwipe:
        top !== null &&
        beneath !== null &&
        top.rises !== true &&
        (top.isCard !== true ||
          (onStepBack !== undefined &&
            top.goesBack === true &&
            (top.trail?.length ?? 0) > 0 &&
            swap === null)) &&
        top.holdsTheEdge !== true &&
        leaving === null,
      canDrop: top !== null && (top.rises === true || top.isCard === true) && leaving === null,
    });
  });

  /**
   * Moves the page on top down with a finger dragging it, and the page beneath a card back up with it.
   *
   * @param dy - How far down the finger has dragged it.
   */
  const pullDown = (dy: number) => {
    const { top, beneath, height } = latest.get('now') ?? NOTHING_YET;

    if (top === null || height === 0) {
      return;
    }

    const pulled = Math.min(Math.max(dy / height, 0), 1);

    placeIn(places, top.key).setValue(pulled);

    if (top.isCard === true && beneath !== null) {
      placeIn(places, beneath.key).setValue(pulled - 1);
    }
  };

  /**
   * Lets go of the page on top, which goes away if it was dragged far or fast enough and springs back
   * otherwise.
   *
   * @param dy - How far down it was dragged.
   * @param vy - How fast it was moving down when let go, in points a millisecond.
   */
  const letGo = (dy: number, vy: number) => {
    const { top, beneath, height, onBack } = latest.get('now') ?? NOTHING_YET;

    if (top === null || height === 0) {
      return;
    }

    const isGoing = dy / height > GOES_DOWN_PAST || vy > GOES_DOWN_FASTER_THAN;

    if (top.isCard === true && beneath !== null) {
      Animated.spring(placeIn(places, beneath.key), {
        ...MOVE,
        toValue: isGoing ? IN_PLACE : PUSHED_UNDER,
      }).start();
    }

    Animated.spring(placeIn(places, top.key), {
      ...MOVE,
      toValue: isGoing ? PUSHED_OFF : IN_PLACE,
    }).start(({ finished }) => {
      if (isGoing && finished) {
        onBack();
      }
    });
  };

  const [dropping] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const now = latest.get('now') ?? NOTHING_YET;

        return (
          now.canDrop &&
          (now.top === null || scrolls.get(now.top.key) !== false) &&
          gesture.vy >= 0 &&
          gesture.dy > 8 &&
          gesture.dy > Math.abs(gesture.dx) * 2
        );
      },
      onPanResponderGrant: (_, gesture) => {
        grabbedAt.dy = gesture.dy;
      },
      onPanResponderMove: (_, gesture) => {
        pullDown(gesture.dy - grabbedAt.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        letGo(gesture.dy - grabbedAt.dy, gesture.vy);
      },
      onPanResponderTerminate: () => {
        const { top, beneath } = latest.get('now') ?? NOTHING_YET;

        if (top !== null) {
          Animated.spring(placeIn(places, top.key), { ...MOVE, toValue: IN_PLACE }).start();
        }

        if (top?.isCard === true && beneath !== null) {
          Animated.spring(placeIn(places, beneath.key), { ...MOVE, toValue: PUSHED_UNDER }).start();
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
      onPanResponderGrant: () => {
        const { top } = latest.get('now') ?? NOTHING_YET;

        if (top?.isCard === true) {
          peeling.setValue(0);
          setPeeled(top.key);
        }
      },
      onPanResponderMove: (_, gesture) => {
        const { top, beneath, width } = latest.get('now') ?? NOTHING_YET;

        if (top === null || beneath === null) {
          return;
        }

        const pulled = Math.min(Math.max(gesture.dx / width, 0), 1);

        if (top.isCard === true) {
          peeling.setValue(pulled);

          return;
        }

        placeIn(places, top.key).setValue(pulled);
        placeIn(places, beneath.key).setValue(pulled - 1);
      },
      onPanResponderRelease: (_, gesture) => {
        const { top, beneath, width, onBack, onStepBack } = latest.get('now') ?? NOTHING_YET;

        if (top === null || beneath === null) {
          return;
        }

        const isGoing = gesture.dx / width > GOES_BACK_PAST || gesture.vx > GOES_BACK_FASTER_THAN;

        if (top.isCard === true) {
          Animated.spring(peeling, { ...MOVE, toValue: isGoing ? 1 : 0 }).start(({ finished }) => {
            if (!finished) {
              return;
            }

            if (isGoing) {
              onStepBack?.();

              return;
            }

            setPeeled(null);
          });

          return;
        }

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

        if (top.isCard === true) {
          Animated.spring(peeling, { ...MOVE, toValue: 0 }).start(() => {
            setPeeled(null);
          });

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
          const isUnderACard = drawn[index + 1]?.isCard === true;
          const rises = page.rises === true || page.isCard === true;
          const across = rises ? height : width;
          const moving = isStill
            ? {
                opacity: place.interpolate({
                  inputRange: [PUSHED_UNDER, IN_PLACE, PUSHED_OFF],
                  outputRange: [1, 1, 0],
                  extrapolate: 'clamp',
                }),
              }
            : {
                transform: isUnderACard
                  ? [
                      {
                        scale: place.interpolate({
                          inputRange: [PUSHED_UNDER, IN_PLACE],
                          outputRange: [UNDER_A_CARD_SCALE, 1],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]
                  : [
                      rises
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
          const shape =
            page.isCard === true
              ? [styles.card, { top: insets.top + CARD_GAP }]
              : isUnderACard
                ? styles.underACard
                : null;

          return (
            <IS_ON_TOP.Provider key={slots.get(page.key) ?? page.key} value={isTop}>
              <Animated.View
                style={[StyleSheet.absoluteFill, shape, moving]}
                pointerEvents={isTop ? 'auto' : 'none'}
                accessibilityElementsHidden={!isTop}
                importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'}
              >
                {page.isCard === true ? cardLayers(page) : page.page}

                {page.isCard === true ? <View pointerEvents="none" style={styles.grabber} /> : null}

                {isStill ? null : (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      styles.dim,
                      {
                        opacity: place.interpolate({
                          inputRange: [PUSHED_UNDER, IN_PLACE],
                          outputRange: [isUnderACard ? UNDER_A_CARD_DIM : UNDER_DIM, 0],
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
