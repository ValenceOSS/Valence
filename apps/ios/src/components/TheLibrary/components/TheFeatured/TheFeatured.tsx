import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { AFeature } from '@ValencePhone/components/TheLibrary/components/TheFeatured/components/AFeature/AFeature';
import { TheDots } from '@ValencePhone/components/TheLibrary/components/TheFeatured/components/TheDots/TheDots';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import type { TheFeaturedProps } from './TheFeatured.types';

const GAP = 12;

const PEEK = 20;

const ASIDE = 0.9;

const CLONES = 2;

const ROOM_FOR_THE_SHADOW = 32;

const SETTLES_AFTER = 600;

const MOVE_ON_AFTER = 28_000;

const styles = StyleSheet.create({
  cards: { gap: GAP, paddingHorizontal: PEEK + GAP, paddingVertical: ROOM_FOR_THE_SHADOW },
  pager: { marginHorizontal: -SCREEN_EDGE, marginVertical: -ROOM_FOR_THE_SHADOW },
  whole: { gap: 10 },
});

/**
 * Which of some number of things a position counts as, going round again past either end.
 *
 * @param position - Where, counting from the first.
 * @param count - How many there are.
 * @returns Which one.
 */
const roundTo = (position: number, count: number): number =>
  count === 0 ? 0 : ((position % count) + count) % count;

/**
 * Runs a dot's fill on from where it has reached to full, evenly, on the native side.
 *
 * @param filled - The fill.
 * @param from - Where it has reached, from nothing to the whole of it.
 * @param overMs - How long until it is full.
 */
const fillOn = (filled: Animated.Value, from: number, overMs: number): void => {
  filled.setValue(from);
  Animated.timing(filled, {
    toValue: 1,
    duration: Math.max(overMs, 0),
    easing: Easing.linear,
    useNativeDriver: true,
  }).start();
};

/**
 * A handful of things from the library, large rounded cards one to a swipe, as the web's home opens
 * on: each plays a clip of itself once it has been showing a moment, and the next comes round
 * when the clip ends, or after a while where there is none.
 *
 * @param items - What to feature.
 * @param onWatch - Told to play something, and from where.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 * @param onShowing - Told which title is showing, whenever that changes.
 * @param onClip - Told the showing title's clip while it plays.
 * @param isInView - Whether the page is scrolled to show it; away from it, nothing plays or moves on.
 *
 * Beneath them, the dots say which is showing and how long is left of it: through its clip while
 * one plays, and otherwise until it moves on by itself.
 */
const TheFeaturedTitles = ({
  items,
  onWatch,
  onLookAt,
  onLookAtShow,
  onShowing,
  onClip,
  isInView = true,
}: TheFeaturedProps) => {
  const { width } = useWindowDimensions();
  const isStill = usePrefersStillness();
  const [filled] = useState(() => new Animated.Value(0));
  const watched = useQuery(viewingQueries.progress());
  const progress = useMemo(() => byMediaId(watched.data ?? []), [watched.data]);
  const count = items.length;
  const lead = count > 1 ? CLONES : 0;
  const [turn, setTurn] = useState(0);
  const at = roundTo(turn, count);
  const cards = useMemo(
    () =>
      Array.from({ length: count + lead * 2 }, (_, place) => place).flatMap((place) => {
        const media = items[roundTo(place - lead, count)];

        return media === undefined ? [] : [media];
      }),
    [items, count, lead],
  );
  const pager = useRef<ScrollView>(null);
  const across = width - (PEEK + GAP) * 2;
  const step = across + GAP;
  const [scrolled] = useState(() => new Animated.Value(0));
  const [pointedAt, setPointedAt] = useState<number | null>(null);
  const followScrolling = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrolled } } }], {
        useNativeDriver: true,
        listener: ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { count: many, lead: before, step: apart } = latest.current;

          setPointedAt(roundTo(Math.round(nativeEvent.contentOffset.x / apart) - before, many));
        },
      }),
    [scrolled],
  );
  const leaning = useMemo(() => {
    const inward = (across * (1 - ASIDE)) / 2;

    return cards.map((_, index) => {
      const inputRange = [(index - 1) * step, index * step, (index + 1) * step];

      return {
        nearness: scrolled.interpolate({
          inputRange,
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateX: scrolled.interpolate({
              inputRange,
              outputRange: [-inward, 0, inward],
              extrapolate: 'clamp',
            }),
          },
          {
            scale: scrolled.interpolate({
              inputRange,
              outputRange: [ASIDE, 1, ASIDE],
              extrapolate: 'clamp',
            }),
          },
        ],
      };
    });
  }, [cards, across, step, scrolled]);
  const showing = items[at] ?? null;

  useEffect(() => {
    onShowing?.(showing);
  }, [showing, onShowing]);

  const moving = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heard = useRef<Parameters<NonNullable<typeof onClip>>[0]>(null);
  const latest = useRef({ turn, count, lead, step, isStill, onClip, isInView });

  useLayoutEffect(() => {
    latest.current = { turn, count, lead, step, isStill, onClip, isInView };
  });

  const findThePlace = useCallback(() => {
    const { turn: now, lead: before, step: apart } = latest.current;
    const x = (before + now) * apart;

    scrolled.setValue(x);
    pager.current?.scrollTo({ x, animated: false });
  }, [scrolled]);

  const settle = useCallback((reached: number) => {
    const { count: many, lead: before, step: apart } = latest.current;
    const real = roundTo(reached, many);

    if (real !== reached) {
      pager.current?.scrollTo({ x: (before + real) * apart, animated: false });
    }

    setTurn(real);
  }, []);

  const showNext = useCallback(() => {
    const { turn: was, count: many, lead: before, step: apart } = latest.current;

    if (many < 2) {
      return;
    }

    const next = was + 1;

    pager.current?.scrollTo({ x: (before + next) * apart, animated: true });
    setTurn(next);

    if (next >= many) {
      setTimeout(() => {
        if (latest.current.turn >= latest.current.count) {
          settle(latest.current.turn);
        }
      }, SETTLES_AFTER);
    }
  }, [settle]);

  useEffect(() => {
    pager.current?.scrollTo({ x: (lead + latest.current.turn) * step, animated: false });
  }, [lead, step]);

  const runOut = useCallback(
    (overMs: (from: number) => number, movesOnItself: boolean, reached?: number) => {
      if (moving.current !== null) {
        clearTimeout(moving.current);
        moving.current = null;
      }

      const runFrom = (from: number) => {
        if (!latest.current.isInView) {
          return;
        }

        if (movesOnItself && latest.current.count > 1) {
          moving.current = setTimeout(showNext, Math.max(overMs(from), 0));
        }

        if (!latest.current.isStill) {
          fillOn(filled, from, overMs(from));
        }
      };

      if (reached === undefined) {
        filled.stopAnimation(runFrom);

        return;
      }

      filled.stopAnimation();
      runFrom(reached);
    },
    [filled, showNext],
  );

  useLayoutEffect(() => {
    heard.current = null;
    filled.setValue(0);
    runOut(() => MOVE_ON_AFTER, true, 0);

    return () => {
      if (moving.current !== null) {
        clearTimeout(moving.current);
        moving.current = null;
      }

      filled.stopAnimation();
    };
  }, [at, filled, runOut]);

  const wasInView = useRef(isInView);

  useEffect(() => {
    if (wasInView.current === isInView) {
      return;
    }

    wasInView.current = isInView;

    if (isInView) {
      runOut((from) => (1 - from) * MOVE_ON_AFTER, true);

      return;
    }

    if (moving.current !== null) {
      clearTimeout(moving.current);
      moving.current = null;
    }

    filled.stopAnimation();
  }, [isInView, filled, runOut]);

  const heardClip = useCallback(
    (player: Parameters<NonNullable<typeof onClip>>[0]) => {
      latest.current.onClip?.(player);

      if (player === heard.current) {
        return;
      }

      heard.current = player;

      if (player !== null && player.duration > 0) {
        runOut(() => (player.duration - player.currentTime) * 1000, false);

        return;
      }

      runOut((from) => (1 - from) * MOVE_ON_AFTER, true);
    },
    [runOut],
  );

  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.whole}>
      <Animated.ScrollView
        ref={pager}
        horizontal
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        contentOffset={{ x: (lead + turn) * step, y: 0 }}
        onLayout={(event) => {
          if (event.nativeEvent.layout.width > 0) {
            findThePlace();
          }
        }}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        contentContainerStyle={styles.cards}
        scrollEventThrottle={16}
        onScroll={followScrolling}
        onMomentumScrollEnd={(event) => {
          settle(Math.round(event.nativeEvent.contentOffset.x / step) - lead);
        }}
      >
        {cards.map((media, index) => {
          const showId = showIdOf(media);
          const isShowing = isInView && index === lead + turn;

          return (
            <Animated.View
              key={`${media.id}:${index.toString()}`}
              style={{ transform: leaning[index]?.transform }}
            >
              <AFeature
                media={media}
                width={across}
                isShowing={isShowing}
                {...(leaning[index] === undefined ? {} : { nearness: leaning[index].nearness })}
                resumeAt={resumeFor(progress, media.id)}
                onEnded={showNext}
                {...(isShowing ? { onClip: heardClip } : {})}
                onPlay={() => {
                  onWatch(media.id, resumeFor(progress, media.id) ?? 0);
                }}
                onMoreInfo={() => {
                  if (showId === null) {
                    onLookAt(media.id);
                  } else {
                    onLookAtShow(media.libraryId, showId);
                  }
                }}
              />
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <TheDots count={count} at={pointedAt ?? at} filled={filled} />
    </View>
  );
};

const TheFeatured = memo(TheFeaturedTitles);

TheFeatured.displayName = 'TheFeatured';

export { TheFeatured };
