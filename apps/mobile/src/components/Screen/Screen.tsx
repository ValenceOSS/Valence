import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, DeviceEventEmitter, Keyboard, StyleSheet, TextInput, View } from 'react-native';
import type { GestureResponderEvent, ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { FIELD_FOCUSED } from '@ValenceMobile/components/Screen/FIELD_FOCUSED';
import { SCROLLED_BY } from '@ValenceMobile/components/Screen/SCROLLED_BY';
import { BackArrow } from '@ValenceMobile/components/BackArrow/BackArrow';
import { CARD_SCROLL } from '@ValenceMobile/components/APageStack/CARD_SCROLL';
import { IS_A_CARD } from '@ValenceMobile/components/APageStack/IS_A_CARD';
import { TheTopBar } from '@ValenceMobile/components/Screen/components/TheTopBar/TheTopBar';
import type { ScreenProps } from './Screen.types';

const CLEAR_OF_THE_ARROW = 56;

const CLEAR_OF_THE_CROSS = 72;

const ROOM_FOR_THE_FOOT = 36;

const FOOT_ABOVE_THE_EDGE = 8;

const BAR_REACH = 52;

const PAST_THE_TITLE = 40;

const SCROLLED = 4;

const CORNER_ON_A_CARD = 14;

const ROOM_BELOW_THE_FIELD = 120;

const SPEED_OVER = 100;

const styles = StyleSheet.create({
  centred: { flex: 1, gap: 16, justifyContent: 'center' },
  centredScrolling: { flexGrow: 1, justifyContent: 'center' },
  corner: { position: 'absolute', right: 12 },
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
 *   and the way back so nothing scrolls under them. It is told how far the page has scrolled, so it
 *   can answer the page being pulled down past its top.
 * @param title - What the page is about, named in that bar — which a page that scrolls with no head
 *   grows too, once its own title has scrolled up under the way back.
 * @param behind - What is drawn behind all of it, over the page's own colour — the lights behind
 *   the way in.
 * @param foot - What sits at the very bottom of it, whatever is above — the build a way in names.
 * On a page drawn as a card it tells the card whether it is scrolled to its top, so pulling down
 * there drags the card away rather than the page, and it does not stretch down past its top. A
 * flick that carries it up to its top still bounces there, as any page does, and it stops
 * stretching once it has come to rest; a finger that drags it up to its top and keeps pulling
 * carries on by dragging the card.
 *
 * @param corner - What floats in the top right, across from the way back, staying put as it scrolls.
 * @param isSeeThrough - Whether it leaves its own colour off, because something behind it draws the
 *   ground — the lights the way in keeps lit from one of its screens to the next.
 * @param scrolls - Whether there is more of it than fits.
 * @param goesBackDown - Whether the way back points down, for a page that rose from below.
 * @param onScrolled - Told whether the page has been scrolled from its top, for whatever sits over
 *   it and changes once it has.
 * @param centres - Whether the little there is belongs in the middle, which a page that scrolls
 *   keeps until there is more of it than fits. One that does not scroll keeps the same room above
 *   and below, so what is in it sits in the true middle rather than below the way back.
 */
const Screen = ({
  children,
  head,
  title,
  behind,
  foot,
  corner,
  isSeeThrough = false,
  scrolls = false,
  centres = false,
  onBack,
  goesBackDown = false,
  onScrolled,
}: ScreenProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const isACard = useContext(IS_A_CARD);
  const tellCard = useContext(CARD_SCROLL);
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrolled] = useState(() => new Animated.Value(0));
  const [headTall, setHeadTall] = useState(0);
  const [isPast, setIsPast] = useState(false);
  const hasBar = scrolls && onBack !== undefined && (head !== undefined || title !== undefined);
  const barFrom =
    head === undefined ? PAST_THE_TITLE : Math.max(headTall - room.top - BAR_REACH, 0);
  const ground = {
    backgroundColor: behind === undefined && !isSeeThrough ? colours.surface : 'transparent',
  };
  const spacing = {
    paddingBottom: room.bottom + SCREEN_EDGE + (foot === undefined ? 0 : ROOM_FOR_THE_FOOT),
    paddingTop:
      room.top +
      (onBack === undefined ? SCREEN_EDGE : isACard ? CLEAR_OF_THE_CROSS : CLEAR_OF_THE_ARROW),
  };

  const scroller = useRef<ScrollViewInstance>(null);
  const isHeadless = head === undefined;
  const latest = useRef({ barFrom, headTall, isHeadless, onScrolled });
  const wasScrolled = useRef<boolean | null>(null);
  const wasAtTop = useRef(true);
  const isGliding = useRef(false);
  const isDragging = useRef(false);
  const finger = useRef<{ y: number; at: number }[]>([]);
  const pulledFrom = useRef<number | null>(null);
  const pulledBy = useRef(0);

  useLayoutEffect(() => {
    latest.current = { barFrom, headTall, isHeadless, onScrolled };
  });

  const tellScrolled = useCallback(
    (y: number) => {
      const isScrolled = y > SCROLLED;

      if (tellCard !== null && wasAtTop.current !== y <= 0) {
        wasAtTop.current = y <= 0;
        tellCard.atTop(y <= 0);

        if (!isGliding.current) {
          setIsAtTop(y <= 0);
        }

        if (y <= 0 && isDragging.current && !isGliding.current) {
          pulledFrom.current = finger.current.at(-1)?.y ?? null;
          pulledBy.current = 0;
        }

        if (y > 0 && pulledFrom.current !== null) {
          pulledFrom.current = null;
          tellCard.pullDown(0);
        }
      }

      if (isScrolled !== wasScrolled.current) {
        wasScrolled.current = isScrolled;
        latest.current.onScrolled?.(isScrolled);
      }
    },
    [tellCard],
  );

  const followAlone = useCallback(
    ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number } } }) => {
      tellScrolled(nativeEvent.contentOffset.y);
    },
    [tellScrolled],
  );

  const glides = useMemo(() => {
    const letGo = ({ nativeEvent }: GestureResponderEvent) => {
      const recent = finger.current.filter((one) => nativeEvent.timestamp - one.at <= SPEED_OVER);
      const first = recent[0];
      const last = recent.at(-1);
      const took = first === undefined || last === undefined ? 0 : last.at - first.at;

      if (pulledFrom.current !== null) {
        pulledFrom.current = null;
        tellCard?.letGo(
          pulledBy.current,
          first === undefined || last === undefined || took <= 0 ? 0 : (last.y - first.y) / took,
        );
      }

      finger.current = [];
    };

    return {
      onMomentumScrollBegin: () => {
        isGliding.current = true;
      },
      onMomentumScrollEnd: () => {
        isGliding.current = false;
        setIsAtTop(wasAtTop.current);
      },
      onScrollBeginDrag: () => {
        isGliding.current = false;
        isDragging.current = true;
        setIsAtTop(wasAtTop.current);
      },
      onScrollEndDrag: () => {
        isDragging.current = false;
      },
      onTouchStart: ({ nativeEvent }: GestureResponderEvent) => {
        finger.current = [{ y: nativeEvent.pageY, at: nativeEvent.timestamp }];
      },
      onTouchMove: ({ nativeEvent }: GestureResponderEvent) => {
        finger.current = [
          ...finger.current.filter((one) => nativeEvent.timestamp - one.at <= SPEED_OVER),
          { y: nativeEvent.pageY, at: nativeEvent.timestamp },
        ];

        if (pulledFrom.current !== null) {
          pulledBy.current = Math.max(nativeEvent.pageY - pulledFrom.current, 0);
          tellCard?.pullDown(pulledBy.current);
        }
      },
      onTouchEnd: letGo,
      onTouchCancel: letGo,
    };
  }, [tellCard]);

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
      setIsPast(
        (latest.current.isHeadless || latest.current.headTall > 0) &&
          value > latest.current.barFrom,
      );
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
        : onScrolled === undefined && tellCard === null
          ? {}
          : { onScroll: followAlone })}
      {...(tellCard === null ? {} : glides)}
      bounces={tellCard === null || !isAtTop}
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
            <SCROLLED_BY.Provider value={hasBar ? scrolled : null}>{head}</SCROLLED_BY.Provider>
          </View>
          <View style={styles.inside}>{children}</View>
        </>
      )}
      {atTheFoot}
    </Animated.ScrollView>
  ) : (
    <View
      style={[
        styles.whole,
        ground,
        styles.inside,
        centres
          ? { paddingVertical: Math.max(spacing.paddingTop, spacing.paddingBottom) }
          : spacing,
        centres && styles.centred,
      ]}
    >
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
      {corner === undefined ? null : (
        <View style={[styles.corner, { top: isACard ? CORNER_ON_A_CARD : room.top + 4 }]}>
          {corner}
        </View>
      )}
    </View>
  );
};

Screen.displayName = 'Screen';

export { Screen };
