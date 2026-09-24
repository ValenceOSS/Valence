import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Animated, Easing, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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

const MOVE_ON_AFTER = 28_000;

const styles = StyleSheet.create({
  whole: { gap: 10 },
});

/**
 * Runs a dot's fill on from wherever it has reached to full, evenly, on the native side, so a
 * change of pace never sends it backwards.
 *
 * @param filled - The fill.
 * @param overMs - How long until it is full, given how far it has reached.
 */
const fillOn = (filled: Animated.Value, overMs: (from: number) => number): void => {
  filled.stopAnimation((from) => {
    Animated.timing(filled, {
      toValue: 1,
      duration: Math.max(overMs(from), 0),
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });
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
}: TheFeaturedProps) => {
  const { width } = useWindowDimensions();
  const isStill = usePrefersStillness();
  const [filled] = useState(() => new Animated.Value(0));
  const watched = useQuery(viewingQueries.progress());
  const progress = useMemo(() => byMediaId(watched.data ?? []), [watched.data]);
  const [at, setAt] = useState(0);
  const pager = useRef<ScrollView>(null);
  const across = width - SCREEN_EDGE * 2;
  const step = across + GAP;
  const showing = items[at] ?? null;

  useEffect(() => {
    onShowing?.(showing);
  }, [showing, onShowing]);

  const moving = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heard = useRef<Parameters<NonNullable<typeof onClip>>[0]>(null);
  const latest = useRef({ at, count: items.length, step, isStill, onClip });

  latest.current = { at, count: items.length, step, isStill, onClip };

  const showNext = useCallback(() => {
    const { at: was, count, step: apart } = latest.current;
    const next = count === 0 ? 0 : (was + 1) % count;

    pager.current?.scrollTo({ x: next * apart, animated: true });
    setAt(next);
  }, []);

  const runOut = useCallback(
    (overMs: (from: number) => number, movesOnItself: boolean) => {
      if (moving.current !== null) {
        clearTimeout(moving.current);
        moving.current = null;
      }

      filled.stopAnimation((from) => {
        if (movesOnItself && latest.current.count > 1) {
          moving.current = setTimeout(showNext, Math.max(overMs(from), 0));
        }

        if (!latest.current.isStill) {
          fillOn(filled, () => overMs(from));
        }
      });
    },
    [filled, showNext],
  );

  useLayoutEffect(() => {
    heard.current = null;
    filled.setValue(0);
    runOut(() => MOVE_ON_AFTER, true);

    return () => {
      if (moving.current !== null) {
        clearTimeout(moving.current);
        moving.current = null;
      }

      filled.stopAnimation();
    };
  }, [at, filled, runOut]);

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

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.whole}>
      <ScrollView
        ref={pager}
        horizontal
        snapToInterval={step}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: GAP }}
        onMomentumScrollEnd={(event) => {
          setAt(Math.round(event.nativeEvent.contentOffset.x / step));
        }}
      >
        {items.map((media, index) => {
          const showId = showIdOf(media);

          return (
            <AFeature
              key={media.id}
              media={media}
              width={across}
              isShowing={index === at}
              resumeAt={resumeFor(progress, media.id)}
              onEnded={showNext}
              {...(index === at ? { onClip: heardClip } : {})}
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
          );
        })}
      </ScrollView>

      <TheDots count={items.length} at={at} filled={filled} />
    </View>
  );
};

const TheFeatured = memo(TheFeaturedTitles);

TheFeatured.displayName = 'TheFeatured';

export { TheFeatured };
