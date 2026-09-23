import { useEffect, useRef, useState } from 'react';
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
 * Runs a dot's fill from where it is to full over some time, evenly, on the native side.
 *
 * @param filled - The fill.
 * @param from - Where it starts, from nothing to the whole of it.
 * @param overMs - How long until it is full.
 */
const fillOver = (filled: Animated.Value, from: number, overMs: number): void => {
  filled.stopAnimation();
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
 *
 * Beneath them, the dots say which is showing and how long is left of it: through its clip while
 * one plays, and otherwise until it moves on by itself.
 */
const TheFeatured = ({
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
  const progress = byMediaId(watched.data ?? []);
  const [at, setAt] = useState(0);
  const pager = useRef<ScrollView>(null);
  const across = width - SCREEN_EDGE * 2;
  const step = across + GAP;
  const showing = items[at] ?? null;

  useEffect(() => {
    onShowing?.(showing);
  }, [showing, onShowing]);

  const showNext = () => {
    const next = items.length === 0 ? 0 : (at + 1) % items.length;

    pager.current?.scrollTo({ x: next * step, animated: true });
    setAt(next);
  };

  useEffect(() => {
    if (isStill) {
      filled.setValue(0);

      return;
    }

    fillOver(filled, 0, MOVE_ON_AFTER);

    return () => {
      filled.stopAnimation();
    };
  }, [at, filled, isStill]);

  /**
   * Hands the page the showing title's clip, and has its dot follow the clip's own time.
   *
   * @param player - The clip's player while it plays, or nothing once it stops.
   */
  const heardClip = (player: Parameters<NonNullable<typeof onClip>>[0]) => {
    onClip?.(player);

    if (player === null || isStill || !(player.duration > 0)) {
      return;
    }

    fillOver(
      filled,
      Math.min(player.currentTime / player.duration, 1),
      (player.duration - player.currentTime) * 1000,
    );
  };

  useEffect(() => {
    if (items.length < 2) {
      return;
    }

    const moving = setTimeout(() => {
      const next = (at + 1) % items.length;

      pager.current?.scrollTo({ x: next * step, animated: true });
      setAt(next);
    }, MOVE_ON_AFTER);

    return () => {
      clearTimeout(moving);
    };
  }, [at, items.length, step]);

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

TheFeatured.displayName = 'TheFeatured';

export { TheFeatured };
