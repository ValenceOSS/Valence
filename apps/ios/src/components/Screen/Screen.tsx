import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { BackArrow } from '@ValencePhone/components/BackArrow/BackArrow';
import type { ScreenProps } from './Screen.types';

const CLEAR_OF_THE_ARROW = 56;

const styles = StyleSheet.create({
  centred: { flex: 1, gap: 16, justifyContent: 'center' },
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
 * @param scrolls - Whether there is more of it than fits.
 * @param centres - Whether the little there is belongs in the middle.
 */
const Screen = ({ children, scrolls = false, centres = false, onBack }: ScreenProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const ground = { backgroundColor: colours.surface };
  const spacing = {
    paddingBottom: room.bottom + SCREEN_EDGE,
    paddingTop: room.top + (onBack === undefined ? SCREEN_EDGE : CLEAR_OF_THE_ARROW),
  };

  const page = scrolls ? (
    <ScrollView
      style={[styles.whole, ground]}
      contentContainerStyle={[styles.inside, spacing]}
      refreshControl={pulling}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.whole, ground, styles.inside, spacing, centres && styles.centred]}>
      {children}
    </View>
  );

  if (onBack === undefined) {
    return page;
  }

  return (
    <View style={styles.whole}>
      {page}
      <BackArrow onBack={onBack} />
    </View>
  );
};

Screen.displayName = 'Screen';

export { Screen };
