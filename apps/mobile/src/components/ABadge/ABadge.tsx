import { StyleSheet, View } from 'react-native';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ABadgeProps } from './ABadge.types';

const styles = StyleSheet.create({
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
});

/**
 * A short word about something, in a rounded badge, as the web's badges are: a genre, whether a
 * programme is still running, that somebody has watched it all.
 *
 * @param children - What it says.
 * @param tone - Outlined, the plain kind; filled, for a genre; or in the accent, for something
 *   somebody has done.
 */
const ABadge = ({ children, tone = 'plain' }: ABadgeProps) => {
  const colours = useTheColours();
  const look =
    tone === 'accent'
      ? { backgroundColor: colours.accent, borderColor: colours.accent }
      : tone === 'solid'
        ? { backgroundColor: colours.surfaceRaised, borderColor: colours.surfaceRaised }
        : { backgroundColor: 'transparent', borderColor: colours.border };

  return (
    <View style={[styles.badge, look]}>
      <Words
        size="small"
        tone={tone === 'accent' ? 'onAccent' : 'plain'}
        isStrong={tone !== 'plain'}
      >
        {children}
      </Words>
    </View>
  );
};

ABadge.displayName = 'ABadge';

export { ABadge };
