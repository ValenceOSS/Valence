import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { AFeature } from '@ValencePhone/components/TheLibrary/components/TheFeatured/components/AFeature/AFeature';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheFeaturedProps } from './TheFeatured.types';

const GAP = 12;

const MOVE_ON_AFTER = 28_000;

const styles = StyleSheet.create({
  dot: { borderRadius: 3, height: 6, width: 6 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  whole: { gap: 10 },
});

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
 */
const TheFeatured = ({
  items,
  onWatch,
  onLookAt,
  onLookAtShow,
  onShowing,
  onClip,
}: TheFeaturedProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
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
              {...(index === at && onClip !== undefined ? { onClip } : {})}
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

      <View style={styles.dots}>
        {items.map((media, index) => (
          <View
            key={media.id}
            style={[styles.dot, { backgroundColor: index === at ? colours.text : colours.border }]}
          />
        ))}
      </View>
    </View>
  );
};

TheFeatured.displayName = 'TheFeatured';

export { TheFeatured };
