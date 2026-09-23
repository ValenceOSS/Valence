import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { BackArrow } from '@ValencePhone/components/BackArrow/BackArrow';
import type { ScreenProps } from './Screen.types';

const CLEAR_OF_THE_ARROW = 56;

const ROOM_FOR_THE_FOOT = 36;

const FOOT_ABOVE_THE_EDGE = 8;

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
 *   the way back, before the rest of it.
 * @param behind - What is drawn behind all of it, over the page's own colour — the lights behind
 *   the way in.
 * @param foot - What sits at the very bottom of it, whatever is above — the build a way in names.
 * @param isSeeThrough - Whether it leaves its own colour off, because something behind it draws the
 *   ground — the lights the way in keeps lit from one of its screens to the next.
 * @param scrolls - Whether there is more of it than fits.
 * @param centres - Whether the little there is belongs in the middle, which a page that scrolls
 *   keeps until there is more of it than fits.
 */
const Screen = ({
  children,
  head,
  behind,
  foot,
  isSeeThrough = false,
  scrolls = false,
  centres = false,
  onBack,
}: ScreenProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const ground = {
    backgroundColor: behind === undefined && !isSeeThrough ? colours.surface : 'transparent',
  };
  const spacing = {
    paddingBottom: room.bottom + SCREEN_EDGE + (foot === undefined ? 0 : ROOM_FOR_THE_FOOT),
    paddingTop: room.top + (onBack === undefined ? SCREEN_EDGE : CLEAR_OF_THE_ARROW),
  };

  const atTheFoot =
    foot === undefined ? null : (
      <View style={[styles.foot, { bottom: room.bottom + FOOT_ABOVE_THE_EDGE }]}>{foot}</View>
    );

  const page = scrolls ? (
    <ScrollView
      style={[styles.whole, ground]}
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
          {head}
          <View style={styles.inside}>{children}</View>
        </>
      )}
      {atTheFoot}
    </ScrollView>
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
      {onBack === undefined ? null : <BackArrow onBack={onBack} />}
    </View>
  );
};

Screen.displayName = 'Screen';

export { Screen };
