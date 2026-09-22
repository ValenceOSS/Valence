import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import type { ScreenProps } from './Screen.types';

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
const Screen = ({ children, scrolls = false, centres = false }: ScreenProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const ground = { backgroundColor: colours.surface };
  const spacing = { paddingBottom: room.bottom + SCREEN_EDGE, paddingTop: room.top + SCREEN_EDGE };

  if (!scrolls) {
    return (
      <View style={[styles.whole, ground, styles.inside, spacing, centres && styles.centred]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.whole, ground]}
      contentContainerStyle={[styles.inside, spacing]}
      refreshControl={pulling}
    >
      {children}
    </ScrollView>
  );
};

Screen.displayName = 'Screen';

export { Screen };
