import { StyleSheet, View } from 'react-native';
import { IS_ON_TOP } from '@ValencePhone/components/APageStack/IS_ON_TOP';
import { useIsOnTop } from '@ValencePhone/hooks/useIsOnTop';
import type { ATabPageProps } from './ATabPage.types';

const styles = StyleSheet.create({
  away: { opacity: 0 },
});

/**
 * One tab's page, kept laid out while another tab shows so coming back to it costs nothing: hidden
 * and out of reach of touch and of anybody listening, and telling what is on it that it is not on
 * top, so anything playing there stops.
 *
 * @param isShowing - Whether its tab is the one showing.
 * @param children - The page.
 */
const ATabPage = ({ isShowing, children }: ATabPageProps) => {
  const isOnTop = useIsOnTop();

  return (
    <View
      collapsable={false}
      style={[StyleSheet.absoluteFill, isShowing ? null : styles.away]}
      pointerEvents={isShowing ? 'auto' : 'none'}
      accessibilityElementsHidden={!isShowing}
      importantForAccessibility={isShowing ? 'auto' : 'no-hide-descendants'}
    >
      <IS_ON_TOP.Provider value={isOnTop && isShowing}>{children}</IS_ON_TOP.Provider>
    </View>
  );
};

ATabPage.displayName = 'ATabPage';

export { ATabPage };
