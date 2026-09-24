import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { BackArrow } from '@ValencePhone/components/BackArrow/BackArrow';
import { TheTopBar } from '@ValencePhone/components/Screen/components/TheTopBar/TheTopBar';
import type { ScreenProps } from './Screen.types';

const CLEAR_OF_THE_ARROW = 56;

const ROOM_FOR_THE_FOOT = 36;

const FOOT_ABOVE_THE_EDGE = 8;

const BAR_REACH = 52;

const SCROLLED = 4;

const styles = StyleSheet.create({
  centred: { flex: 1, gap: 16, justifyContent: 'center' },
  centredScrolling: { flexGrow: 1, justifyContent: 'center' },
  foot: { alignItems: 'center', left: SCREEN_EDGE, position: 'absolute', right: SCREEN_EDGE },
  inside: { gap: 20, paddingHorizontal: SCREEN_EDGE },
  whole: { flex: 1 },
});

/**
 * The ground every screen is drawn on: the theme's own background, and room for whatever the phone
 * has put over the top and bottom of it.
 *
 * The insets are asked for rather than guessed with a fixed inset, because the notch, the status
 * bar and the home indicator are different sizes on every device and a guess is wrong on all but
 * the one it was measured against.
 *
 * @param children - What is on it.
 * @param head - What runs edge to edge across the top of a page that scrolls, under the clock and
 *   the way back, before the rest of it. Once it has scrolled away, a bar comes in behind the clock
 *   and the way back so nothing scrolls under them.
 * @param title - What the page is about, named in that bar.
 * @param behind - What is drawn behind all of it, over the page's own colour — the lights behind
 *   the way in.
 * @param foot - What sits at the very bottom of it, whatever is above — the build a way in names.
 * @param isSeeThrough - Whether it leaves its own colour off, because something behind it draws the
 *   ground — the lights the way in keeps lit from one of its screens to the next.
 * @param scrolls - Whether there is more of it than fits.
 * @param goesBackDown - Whether the way back points down, for a page that rose from below.
 * @param onScrolled - Told whether the page has been scrolled from its top, for whatever sits over
 *   it and changes once it has.
 * @param centres - Whether the little there is belongs in the middle, which a page that scrolls
 *   keeps until there is more of it than fits.
 */
const Screen = ({
  children,
  head,
  title,
  behind,
  foot,
  isSeeThrough = false,
  scrolls = false,
  centres = false,
  onBack,
  goesBackDown = false,
  onScrolled,
}: ScreenProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const [scrolled] = useState(() => new Animated.Value(0));
  const [headTall, setHeadTall] = useState(0);
  const [isPast, setIsPast] = useState(false);
  const hasBar = scrolls && head !== undefined && onBack !== undefined;
  const barFrom = Math.max(headTall - room.top - BAR_REACH, 0);
  const ground = {
    backgroundColor: behind === undefined && !isSeeThrough ? colours.surface : 'transparent',
  };
  const spacing = {
    paddingBottom: room.bottom + SCREEN_EDGE + (foot === undefined ? 0 : ROOM_FOR_THE_FOOT),
    paddingTop: room.top + (onBack === undefined ? SCREEN_EDGE : CLEAR_OF_THE_ARROW),
  };

  const latest = useRef({ barFrom, headTall, onScrolled });
  const wasScrolled = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    latest.current = { barFrom, headTall, onScrolled };
  });

  const scrolling = useMemo(() => {
    /**
     * Tells whoever asked whether the page has left its top, only when that changes.
     *
     * @param y - How far down the page is scrolled.
     */
    const tellScrolled = (y: number) => {
      const isScrolled = y > SCROLLED;

      if (isScrolled !== wasScrolled.current) {
        wasScrolled.current = isScrolled;
        latest.current.onScrolled?.(isScrolled);
      }
    };

    return {
      withBar: Animated.event([{ nativeEvent: { contentOffset: { y: scrolled } } }], {
        useNativeDriver: true,
        listener: ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number } } }) => {
          const { y } = nativeEvent.contentOffset;

          setIsPast(latest.current.headTall > 0 && y > latest.current.barFrom);
          tellScrolled(y);
        },
      }),
      alone: ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number } } }) => {
        tellScrolled(nativeEvent.contentOffset.y);
      },
    };
  }, [scrolled]);

  const atTheFoot =
    foot === undefined ? null : (
      <View style={[styles.foot, { bottom: room.bottom + FOOT_ABOVE_THE_EDGE }]}>{foot}</View>
    );

  const page = scrolls ? (
    <Animated.ScrollView
      style={[styles.whole, ground]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      {...(hasBar
        ? { onScroll: scrolling.withBar }
        : onScrolled === undefined
          ? {}
          : { onScroll: scrolling.alone })}
      contentContainerStyle={
        head === undefined
          ? [styles.inside, spacing, centres && styles.centredScrolling]
          : { paddingBottom: spacing.paddingBottom }
      }
      refreshControl={pulling}
    >
      {head === undefined ? (
        children
      ) : (
        <>
          <View
            onLayout={({ nativeEvent }) => {
              setHeadTall(nativeEvent.layout.height);
            }}
          >
            {head}
          </View>
          <View style={styles.inside}>{children}</View>
        </>
      )}
      {atTheFoot}
    </Animated.ScrollView>
  ) : (
    <View style={[styles.whole, ground, styles.inside, spacing, centres && styles.centred]}>
      {children}
      {atTheFoot}
    </View>
  );

  if (onBack === undefined && behind === undefined) {
    return page;
  }

  return (
    <View style={[styles.whole, isSeeThrough ? null : { backgroundColor: colours.surface }]}>
      {behind}
      {page}
      {hasBar ? (
        <TheTopBar title={title} scrolled={scrolled} from={barFrom} isPast={isPast} />
      ) : null}
      {onBack === undefined ? null : <BackArrow onBack={onBack} pointsDown={goesBackDown} />}
    </View>
  );
};

Screen.displayName = 'Screen';

export { Screen };
