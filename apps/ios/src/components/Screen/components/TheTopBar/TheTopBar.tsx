import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ABlur } from '@ValencePhone/components/ABlur/ABlur';
import { Words } from '@ValencePhone/components/Words/Words';
import { theColours } from '@ValencePhone/theme/theColours';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheTopBarProps } from './TheTopBar.types';

const BAR = 52;

const FADES_OVER = 40;

const CLEAR_OF_THE_ARROW = 64;

const styles = StyleSheet.create({
  bar: { left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 },
  edge: { bottom: 0, height: StyleSheet.hairlineWidth, left: 0, position: 'absolute', right: 0 },
  title: {
    alignItems: 'center',
    bottom: 0,
    height: BAR,
    justifyContent: 'center',
    left: CLEAR_OF_THE_ARROW,
    position: 'absolute',
    right: CLEAR_OF_THE_ARROW,
  },
});

/**
 * The bar a page with artwork at its head grows once that artwork has scrolled away, as the web's
 * dialogs grow a title: the page blurred behind the clock and the way back, so nothing scrolls under
 * them, with what the page is about named in the middle.
 *
 * @param title - What the page is about, where it says.
 * @param scrolled - How far the page has scrolled.
 * @param from - How far it has to scroll before the bar comes in.
 * @param isPast - Whether it has scrolled that far.
 */
const TheTopBar = ({ title, scrolled, from, isPast }: TheTopBarProps) => {
  const room = useSafeAreaInsets();
  const colours = useTheColours();
  const shown = scrolled.interpolate({
    inputRange: [from, from + FADES_OVER],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.bar, { height: room.top + BAR }]} pointerEvents="none">
      <ABlur isDark={colours.surface === theColours.dark.surface} isOn={isPast} changesOver={250} />

      <Animated.View style={[styles.edge, { backgroundColor: colours.border, opacity: shown }]} />

      {title === undefined ? null : (
        <Animated.View style={[styles.title, { opacity: shown }]}>
          <Words lines={1} isStrong>
            {title}
          </Words>
        </Animated.View>
      )}
    </View>
  );
};

TheTopBar.displayName = 'TheTopBar';

export { TheTopBar };
