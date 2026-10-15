import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Keyboard, StyleSheet, TextInput, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { FIELD_FOCUSED } from '@ValenceMobile/components/Screen/FIELD_FOCUSED';
import { BackArrow } from '@ValenceMobile/components/BackArrow/BackArrow';
import { TheTopBar } from '@ValenceMobile/components/Screen/components/TheTopBar/TheTopBar';
import type { ScreenProps } from './Screen.types';

const CLEAR_OF_THE_ARROW = 56;

const ROOM_FOR_THE_FOOT = 36;

const FOOT_ABOVE_THE_EDGE = 8;

const BAR_REACH = 52;

const SCROLLED = 4;

const ROOM_BELOW_THE_FIELD = 120;

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
 * A page that scrolls makes room for the keyboard and, as it opens or as another field is chosen
 * while it is open, scrolls the field being typed in clear of it with room to spare beneath, so the
 * button that follows a field is not left under the keys.
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

  const scroller = useRef<ScrollViewInstance>(null);
  const latest = useRef({ barFrom, headTall, onScrolled });
  const wasScrolled = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    latest.current = { barFrom, headTall, onScrolled };
  });

  const tellScrolled = useCallback((y: number) => {
    const isScrolled = y > SCROLLED;

    if (isScrolled !== wasScrolled.current) {
      wasScrolled.current = isScrolled;
      latest.current.onScrolled?.(isScrolled);
    }
  }, []);

  const followAlone = useCallback(
    ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number } } }) => {
      tellScrolled(nativeEvent.contentOffset.y);
    },
    [tellScrolled],
  );

  const withBar = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrolled } } }], {
        useNativeDriver: true,
      }),
    [scrolled],
  );

  useEffect(() => {
    if (!hasBar) {
      return undefined;
    }

    const following = scrolled.addListener(({ value }) => {
      setIsPast(latest.current.headTall > 0 && value > latest.current.barFrom);
      tellScrolled(value);
    });

    return () => {
      scrolled.removeListener(following);
    };
  }, [hasBar, scrolled, tellScrolled]);

  useEffect(() => {
    if (!scrolls) {
      return undefined;
    }

    let keyboardTop: number | null = null;

    const clearTheField = () => {
      const focused = TextInput.State.currentlyFocusedInput() ?? null;
      const list = scroller.current;
      const inside = list?.getInnerViewRef() ?? null;
      const top = keyboardTop;

      if (focused === null || list === null || inside === null || top === null) {
        return;
      }

      focused.measureLayout(
        inside,
        (_left, fieldTop, _width, tall) => {
          inside.measureInWindow((_insideLeft, insideTop) => {
            list.measureInWindow((_listLeft, listTop) => {
              const over = insideTop + fieldTop + tall + ROOM_BELOW_THE_FIELD - top;

              if (over > 0) {
                list.scrollTo({ y: listTop - insideTop + over, animated: true });
              }
            });
          });
        },
        () => undefined,
      );
    };

    const shown = Keyboard.addListener('keyboardDidShow', ({ endCoordinates }) => {
      keyboardTop = endCoordinates.screenY;
      clearTheField();
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop = null;
    });
    const focused = DeviceEventEmitter.addListener(FIELD_FOCUSED, clearTheField);

    return () => {
      shown.remove();
      hidden.remove();
      focused.remove();
    };
  }, [scrolls]);

  const atTheFoot =
    foot === undefined ? null : (
      <View style={[styles.foot, { bottom: room.bottom + FOOT_ABOVE_THE_EDGE }]}>{foot}</View>
    );

  const page = scrolls ? (
    <Animated.ScrollView
      ref={scroller}
      style={[styles.whole, ground]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      {...(hasBar
        ? { onScroll: withBar }
        : onScrolled === undefined
          ? {}
          : { onScroll: followAlone })}
      contentContainerStyle={
        head === undefined
          ? [styles.inside, spacing, centres && styles.centredScrolling]
          : { paddingBottom: spacing.paddingBottom }
      }
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
