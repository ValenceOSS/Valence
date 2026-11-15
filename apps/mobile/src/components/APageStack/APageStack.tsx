import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GestureDetector, GestureStateManager, usePanGesture } from 'react-native-gesture-handler';
import { ReduceMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from 'react-native-screens';
import { scheduleOnRN } from 'react-native-worklets';
import { ACardLayer } from '@ValenceMobile/components/APageStack/components/ACardLayer/ACardLayer';
import { AStackLayer } from '@ValenceMobile/components/APageStack/components/AStackLayer/AStackLayer';
import { PLACE } from '@ValenceMobile/components/APageStack/PLACE';
import { howEachIsKept } from '@ValenceMobile/components/APageStack/howEachIsKept';
import { stackAfter } from '@ValenceMobile/components/APageStack/stackAfter';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { ACardMotion } from '@ValenceMobile/components/APageStack/components/ACardLayer/ACardLayer.types';
import type { ACardSwap, AKeeping, APageStackProps, AStackedPage } from './APageStack.types';

const EDGE = 24;

const STARTS_AFTER = 8;

const GOES_BACK_PAST = 0.35;

const GOES_BACK_FASTER_THAN = 0.5;

const GOES_DOWN_PAST = 0.35;

const GOES_DOWN_FASTER_THAN = 1;

const CARD_GAP = 10;

const STATUS_BAR_AT_LEAST = 36;

const KEPT_BENEATH = 2;

const MILLISECONDS_A_SECOND = 1000;

const MOVE = { ...SPRINGS.liquid, overshootClamping: true, reduceMotion: ReduceMotion.Never };

const FROZEN: AKeeping = { activity: 0, isFrozen: true };

const styles = StyleSheet.create({ whole: { ...StyleSheet.absoluteFill } });

/**
 * Taps the phone lightly, as a page dragged far enough goes.
 */
const feelItGo = (): void => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Springs a place to where it is going, carrying on at the speed it was already moving.
 *
 * @param place - The place.
 * @param to - Where it is going.
 * @param velocity - How fast it was already moving there, in places a second.
 * @param then - Told whether it got there, rather than being sent somewhere else on the way.
 */
const springTo = (
  place: SharedValue<number>,
  to: number,
  velocity: number,
  then?: (isThere: boolean) => void,
): void => {
  'worklet';
  place.set(
    withSpring(to, { ...MOVE, velocity }, (finished) => {
      'worklet';
      then?.(finished === true);
    }),
  );
};

/**
 * Moves the page on top as far as a finger has pulled it, and the page beneath back with it.
 *
 * @param top - Where the page on top stands.
 * @param beneath - Where the page beneath it stands, where it moves with it.
 * @param pulled - How far it has been pulled, from in place to all the way off.
 */
const pullTo = (
  top: SharedValue<number>,
  beneath: SharedValue<number> | null,
  pulled: number,
): void => {
  'worklet';
  top.set(pulled);

  if (beneath !== null) {
    beneath.set(pulled - 1);
  }
};

/**
 * Lets go of the page on top, which goes if it was pulled far or fast enough and springs back
 * otherwise, the page beneath following it.
 *
 * @param top - Where the page on top stands.
 * @param beneath - Where the page beneath it stands, where it moves with it.
 * @param isGoing - Whether it goes.
 * @param velocity - How fast it was moving when let go, in places a second.
 * @param onGone - Told once it has gone.
 */
const letGoOf = (
  top: SharedValue<number>,
  beneath: SharedValue<number> | null,
  isGoing: boolean,
  velocity: number,
  onGone: () => void,
): void => {
  'worklet';

  if (isGoing) {
    scheduleOnRN(feelItGo);
  }

  if (beneath !== null) {
    springTo(beneath, isGoing ? PLACE.inPlace : PLACE.under, velocity);
  }

  springTo(top, isGoing ? PLACE.off : PLACE.inPlace, velocity, (isThere) => {
    'worklet';

    if (isGoing && isThere) {
      scheduleOnRN(onGone);
    }
  });
};

/**
 * Puts the page on top back where it stood, and the page beneath back under it.
 *
 * @param top - Where the page on top stands.
 * @param beneath - Where the page beneath it stands, where it moved with it.
 */
const putBack = (top: SharedValue<number>, beneath: SharedValue<number> | null): void => {
  'worklet';
  springTo(top, PLACE.inPlace, 0);

  if (beneath !== null) {
    springTo(beneath, PLACE.under, 0);
  }
};

/**
 * Where a share of the way a finger has moved lands, kept between none of it and all of it.
 *
 * @param moved - How far it moved.
 * @param across - How far all the way is.
 * @returns The share, from nought to one.
 */
const shareOf = (moved: number, across: number): number => {
  'worklet';

  return across === 0 ? 0 : Math.min(Math.max(moved / across, 0), 1);
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
 * corners rounded, and below the clock even where the screen keeps no room at its top for it, as the
 * open inside of a folding phone does not, while the page it opened over shrinks back and dims beneath it, as a sheet does on
 * an iPhone; dragging it down follows the finger and lets the page beneath grow back with it. A card
 * swapped for another keeps its place, and its content slides across inside it: the new one in from
 * the right going deeper, the old one away to the right coming back. A small pill at its top says it
 * can be dragged down.
 *
 * A page swapped for another in its place — a title found already in the library, opened in place of
 * the page that would have asked for it — takes over where the one it replaced stood, sliding in if
 * that one still was, rather than starting again off to the side.
 *
 * Every page stays mounted beneath the one on top, so going back returns to it as it was left,
 * scrolled where it was scrolled; only the top one is told it is on top, so the rest can stop
 * playing. The page beneath the top one stays live, so a swipe can reveal it, and every page below
 * that is frozen and taken off the screen natively until it is gone back to, so it neither draws nor
 * renders again while it is covered. Fingers are followed and pages moved on the interface thread.
 * Where somebody has asked their phone for less motion, pages cross-fade instead of sliding.
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
  const [held, setHeld] = useState(() => stackAfter(null, pages, null));
  const [leaving, setLeaving] = useState<AStackedPage | null>(null);
  const [swap, setSwap] = useState<ACardSwap | null>(null);
  const [peeled, setPeeled] = useState<string | null>(null);
  const [arrivingKey, setArrivingKey] = useState<string | null>(null);
  const swapping = useSharedValue(1);
  const peeling = useSharedValue(0);
  const canSwipe = useSharedValue(false);
  const canDrop = useSharedValue(false);
  const isTopAtItsTop = useSharedValue(true);
  const fromX = useSharedValue(0);
  const fromY = useSharedValue(0);
  const lastDown = useSharedValue(0);
  const grabbedAt = useSharedValue(0);
  const before = useRef(pages);
  const scrolls = useRef(new Map<string, boolean>());
  const latest = useRef<{
    top: AStackedPage | null;
    topPlace: SharedValue<number> | null;
    beneathPlace: SharedValue<number> | null;
    height: number;
    onBack: () => void;
  }>({ top: null, topPlace: null, beneathPlace: null, height: 0, onBack });
  const cardInsets = useMemo(() => ({ ...insets, top: 0 }), [insets]);

  if (held.pages !== pages) {
    const gone = held.pages.at(-1) ?? null;
    const arrived = pages.at(-1) ?? null;
    const isPopped = pages.length < held.pages.length && gone !== null && pages.length > 0;

    if (isPopped) {
      setLeaving(gone);
    }

    if (
      pages.length === held.pages.length &&
      gone !== null &&
      arrived !== null &&
      gone.key !== arrived.key &&
      gone.isCard === true &&
      arrived.isCard === true
    ) {
      if (peeled === gone.key) {
        setPeeled(null);
      } else {
        setSwap({ gone, toKey: arrived.key, isForward: (arrived.depth ?? 0) > (gone.depth ?? 0) });
      }
    }

    setHeld(stackAfter(held, pages, isPopped ? gone : leaving));
  }

  const drawn =
    leaving === null || pages.some((page) => page.key === leaving.key)
      ? pages
      : [...pages, leaving];
  const top = drawn.at(-1) ?? null;
  const beneath = drawn.at(-2) ?? null;
  const topKey = pages.at(-1)?.key ?? null;
  const keeping = howEachIsKept(drawn, pages);

  /**
   * Where a page stands in the stack as it is held now.
   *
   * @param key - The page.
   * @returns Its place, or nothing for a page the stack does not hold.
   */
  const placeOf = (key: string): SharedValue<number> | null =>
    held.places.get(held.slots.get(key) ?? key) ?? null;

  const topPlace = top === null ? null : placeOf(top.key);
  const beneathPlace = beneath === null ? null : placeOf(beneath.key);
  const isTopACard = top?.isCard === true;
  const swipedKey = top?.key ?? null;
  const dropsBeneath = isTopACard ? beneathPlace : null;
  const swipes =
    top !== null &&
    beneath !== null &&
    top.rises !== true &&
    (top.isCard !== true ||
      (onStepBack !== undefined &&
        top.goesBack === true &&
        (top.trail?.length ?? 0) > 0 &&
        swap === null)) &&
    top.holdsTheEdge !== true &&
    leaving === null;
  const drops = top !== null && (top.rises === true || top.isCard === true) && leaving === null;

  useLayoutEffect(() => {
    canSwipe.set(swipes);
    canDrop.set(drops);
    isTopAtItsTop.set(top === null || scrolls.current.get(top.key) !== false);
    latest.current = { top, topPlace, beneathPlace, height, onBack };
  });

  const forgetLeaving = useCallback((key: string) => {
    setLeaving((still) => (still?.key === key ? null : still));
  }, []);

  const settleArriving = useCallback((key: string) => {
    setArrivingKey((still) => (still === key ? null : still));
  }, []);

  const endSwap = useCallback(() => {
    setSwap(null);
  }, []);

  const unpeel = useCallback(() => {
    setPeeled(null);
  }, []);

  useLayoutEffect(() => {
    if (swap === null) {
      return;
    }

    swapping.set(0);
    springTo(swapping, 1, 0, (isThere) => {
      'worklet';

      if (isThere) {
        scheduleOnRN(endSwap);
      }
    });
  }, [swap, swapping, endSwap]);

  useLayoutEffect(() => {
    const was = before.current;

    before.current = pages;

    /**
     * Where a page stands in the stack as it was just changed.
     *
     * @param key - The page.
     * @returns Its place, or nothing for a page the stack does not hold.
     */
    const placeNow = (key: string): SharedValue<number> | null =>
      held.places.get(held.slots.get(key) ?? key) ?? null;

    const opened = pages.at(-1) ?? null;
    const under = pages.at(-2) ?? null;
    const underPlace = under === null ? null : placeNow(under.key);

    if (pages.length > was.length && opened !== null) {
      const arriving = placeNow(opened.key);

      if (arriving === null) {
        return undefined;
      }

      const openedKey = opened.key;

      setArrivingKey(openedKey);

      const settle = (): void => {
        'worklet';
        scheduleOnRN(settleArriving, openedKey);
      };

      if (opened.rises === true || opened.isCard === true) {
        let hasRisen = false;

        const rise = () => {
          hasRisen = true;
          springTo(arriving, PLACE.inPlace, 0, settle);

          if (opened.isCard === true && underPlace !== null) {
            springTo(underPlace, PLACE.under, 0);
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

      springTo(arriving, PLACE.inPlace, 0, settle);

      if (underPlace !== null) {
        springTo(underPlace, PLACE.under, 0);
      }

      return undefined;
    }

    if (pages.length === was.length && opened !== null && opened.key !== was.at(-1)?.key) {
      const swappedIn = placeNow(opened.key);

      if (swappedIn !== null) {
        springTo(swappedIn, PLACE.inPlace, 0);
      }

      return undefined;
    }

    const gone = was.at(-1) ?? null;
    const gonePlace = gone === null ? null : placeNow(gone.key);
    const openedPlace = opened === null ? null : placeNow(opened.key);

    if (pages.length >= was.length || gone === null || opened === null) {
      return undefined;
    }

    const openedKey = opened.key;
    const goneKey = gone.key;

    setArrivingKey(openedKey);

    if (openedPlace !== null) {
      springTo(openedPlace, PLACE.inPlace, 0, () => {
        'worklet';
        scheduleOnRN(settleArriving, openedKey);
      });
    }

    if (gonePlace !== null) {
      springTo(gonePlace, PLACE.off, 0, () => {
        'worklet';
        scheduleOnRN(forgetLeaving, goneKey);
      });
    }

    return undefined;
  }, [pages, held, settleArriving, forgetLeaving]);

  const [cardHands] = useState(() => ({
    onAtTop: (key: string, isAtTop: boolean) => {
      scrolls.current.set(key, isAtTop);

      if (latest.current.top?.key === key) {
        isTopAtItsTop.set(isAtTop);
      }
    },
    pullDown: (dy: number) => {
      const now = latest.current;

      if (now.top === null || now.topPlace === null || now.height === 0) {
        return;
      }

      pullTo(
        now.topPlace,
        now.top.isCard === true ? now.beneathPlace : null,
        shareOf(dy, now.height),
      );
    },
    letGo: (dy: number, vy: number) => {
      const now = latest.current;

      if (now.top === null || now.topPlace === null || now.height === 0) {
        return;
      }

      letGoOf(
        now.topPlace,
        now.top.isCard === true ? now.beneathPlace : null,
        dy / now.height > GOES_DOWN_PAST || vy > GOES_DOWN_FASTER_THAN,
        (vy * MILLISECONDS_A_SECOND) / now.height,
        now.onBack,
      );
    },
  }));

  const swipeBack = usePanGesture({
    testID: 'swipeBack',
    manualActivation: true,
    onTouchesDown: (event) => {
      'worklet';
      const touch = event.changedTouches[0];

      if (touch !== undefined) {
        fromX.set(touch.absoluteX);
        fromY.set(touch.absoluteY);
      }
    },
    onTouchesMove: (event) => {
      'worklet';
      const touch = event.allTouches[0];

      if (touch === undefined) {
        return;
      }

      if (!canSwipe.get() || fromX.get() >= EDGE) {
        GestureStateManager.fail(event.handlerTag);

        return;
      }

      const dx = touch.absoluteX - fromX.get();
      const dy = touch.absoluteY - fromY.get();

      if (dx > STARTS_AFTER && Math.abs(dy) < dx) {
        GestureStateManager.activate(event.handlerTag);
      }
    },
    onActivate: () => {
      'worklet';

      if (isTopACard && swipedKey !== null) {
        peeling.set(0);
        scheduleOnRN(setPeeled, swipedKey);
      }
    },
    onUpdate: (event) => {
      'worklet';

      if (topPlace === null || beneathPlace === null) {
        return;
      }

      const pulled = shareOf(event.translationX, width);

      if (isTopACard) {
        peeling.set(pulled);

        return;
      }

      pullTo(topPlace, beneathPlace, pulled);
    },
    onDeactivate: (event) => {
      'worklet';

      if (topPlace === null || beneathPlace === null) {
        return;
      }

      if (event.canceled) {
        if (isTopACard) {
          springTo(peeling, 0, 0, () => {
            'worklet';
            scheduleOnRN(unpeel);
          });

          return;
        }

        putBack(topPlace, beneathPlace);

        return;
      }

      const isGoing =
        shareOf(event.translationX, width) > GOES_BACK_PAST ||
        event.velocityX / MILLISECONDS_A_SECOND > GOES_BACK_FASTER_THAN;
      const velocity = width === 0 ? 0 : event.velocityX / width;

      if (!isTopACard) {
        letGoOf(topPlace, beneathPlace, isGoing, velocity, onBack);

        return;
      }

      if (isGoing) {
        scheduleOnRN(feelItGo);
      }

      springTo(peeling, isGoing ? 1 : 0, velocity, (isThere) => {
        'worklet';

        if (!isThere) {
          return;
        }

        if (!isGoing) {
          scheduleOnRN(unpeel);
        } else if (onStepBack !== undefined) {
          scheduleOnRN(onStepBack);
        }
      });
    },
  });

  const dragDown = usePanGesture({
    testID: 'dragDown',
    manualActivation: true,
    onTouchesDown: (event) => {
      'worklet';
      const touch = event.changedTouches[0];

      if (touch !== undefined) {
        fromX.set(touch.absoluteX);
        fromY.set(touch.absoluteY);
        lastDown.set(0);
      }
    },
    onTouchesMove: (event) => {
      'worklet';
      const touch = event.allTouches[0];

      if (touch === undefined) {
        return;
      }

      const dx = touch.absoluteX - fromX.get();
      const dy = touch.absoluteY - fromY.get();
      const isStillGoingDown = dy >= lastDown.get();

      lastDown.set(dy);

      if (
        canDrop.get() &&
        isTopAtItsTop.get() &&
        isStillGoingDown &&
        dy > STARTS_AFTER &&
        dy > Math.abs(dx) * 2
      ) {
        GestureStateManager.activate(event.handlerTag);
      }
    },
    onActivate: (event) => {
      'worklet';
      grabbedAt.set(event.translationY);
    },
    onUpdate: (event) => {
      'worklet';

      if (topPlace !== null) {
        pullTo(topPlace, dropsBeneath, shareOf(event.translationY - grabbedAt.get(), height));
      }
    },
    onDeactivate: (event) => {
      'worklet';

      if (topPlace === null || height === 0) {
        return;
      }

      if (event.canceled) {
        putBack(topPlace, dropsBeneath);

        return;
      }

      const dy = event.translationY - grabbedAt.get();
      const vy = event.velocityY / MILLISECONDS_A_SECOND;

      letGoOf(
        topPlace,
        dropsBeneath,
        dy / height > GOES_DOWN_PAST || vy > GOES_DOWN_FASTER_THAN,
        event.velocityY / height,
        onBack,
      );
    },
  });

  /**
   * Draws a card's pages: the one it shows; the last few it took the place of, kept beneath it so
   * going back finds them as they were left, the one it steps back to kept live for a swipe to reveal
   * and the rest frozen and off the screen, while any further back are drawn afresh when gone back
   * to, so a long run stays light; and while it is swapping one card's worth for another, the one
   * leaving too.
   *
   * @param page - The card's page now.
   * @param kept - How the card itself is kept.
   * @returns Its layers.
   */
  const cardLayers = (page: AStackedPage, kept: AKeeping): ReactNode => {
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
    const stepsBackTo = trail.at(-1)?.key ?? null;
    const isTopCard = topKey === page.key;

    return (
      <ScreenContainer style={styles.whole}>
        {layers.map((layer) => {
          const isGoing = isSwapping && layer.key === swap.gone.key;
          const isShown = layer.key === page.key;
          const isMoving = isSwapping && (isGoing || isShown);
          const isPeeling = isPeeled && (isShown || layer.key === stepsBackTo);
          const isHidden = !isShown && !isMoving && !isPeeling;
          const isLive = !isHidden || (isTopCard && layer.key === stepsBackTo);
          const motion: ACardMotion = isHidden
            ? 'hidden'
            : isPeeling
              ? isShown
                ? 'peelingAway'
                : 'peeledTo'
              : !isMoving
                ? 'shown'
                : isGoing
                  ? swap.isForward
                    ? 'goingForward'
                    : 'goingBack'
                  : swap.isForward
                    ? 'arrivingForward'
                    : 'arrivingBack';

          return (
            <ACardLayer
              key={layer.key}
              layer={layer}
              motion={motion}
              keeping={{
                activity: isShown ? 2 : isLive ? 1 : 0,
                isFrozen: kept.isFrozen || !isLive,
              }}
              isOnTop={!isHidden && isTopCard}
              isLifted={isSwapping ? (swap.isForward ? !isGoing : isGoing) : isPeeled && isShown}
              isTouchable={!isGoing && !isHidden && (!isPeeling || isShown)}
              isStill={isStill}
              width={width}
              swapping={swapping}
              peeling={peeling}
              insets={cardInsets}
              onAtTop={cardHands.onAtTop}
              pullDown={cardHands.pullDown}
              letGo={cardHands.letGo}
            />
          );
        })}
      </ScreenContainer>
    );
  };

  return (
    <GestureDetector gesture={swipeBack}>
      <View style={styles.whole} collapsable={false}>
        <GestureDetector gesture={dragDown}>
          <View style={styles.whole} collapsable={false}>
            <ScreenContainer style={styles.whole}>
              {drawn.map((page, index) => {
                const place = placeOf(page.key);
                const kept = keeping.get(page.key) ?? FROZEN;

                return place === null ? null : (
                  <AStackLayer
                    key={held.slots.get(page.key) ?? page.key}
                    place={place}
                    keeping={kept}
                    isTop={page.key === topKey}
                    isCard={page.isCard === true}
                    isUnderACard={drawn[index + 1]?.isCard === true}
                    rises={page.rises === true}
                    isStill={isStill}
                    isMoving={page.key === arrivingKey || page.key === leaving?.key}
                    cardTop={Math.max(insets.top, STATUS_BAR_AT_LEAST) + CARD_GAP}
                    width={width}
                    height={height}
                  >
                    {page.isCard === true ? (
                      cardLayers(page, kept)
                    ) : (
                      <Fragment key={page.key}>{page.page}</Fragment>
                    )}
                  </AStackLayer>
                );
              })}
            </ScreenContainer>
          </View>
        </GestureDetector>
      </View>
    </GestureDetector>
  );
};

APageStack.displayName = 'APageStack';

export { APageStack };
