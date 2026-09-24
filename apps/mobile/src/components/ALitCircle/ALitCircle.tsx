import { StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ALitCircleProps } from './ALitCircle.types';

const ROOM = 18;

const styles = StyleSheet.create({
  round: { alignItems: 'center', borderRadius: 999, justifyContent: 'center' },
});

/**
 * The icon of a button that is on or off — shuffle, repeat, the words — drawn as the Apple TV app
 * draws one that is on: in a circle of the page's own ink, the icon cut out of it in the page's
 * colour. Off, it is the icon alone, muted.
 *
 * @param of - Which icon.
 * @param size - How big the icon is; the circle leaves room around it.
 * @param isLit - Whether it is on.
 */
const ALitCircle = ({ of, size, isLit }: ALitCircleProps) => {
  const colours = useTheColours();
  const across = size + ROOM;

  return (
    <View
      style={[
        styles.round,
        { height: across, width: across },
        isLit ? { backgroundColor: colours.accent } : null,
      ]}
    >
      <Icon of={of} size={size} colour={isLit ? colours.accentContrast : colours.textMuted} />
    </View>
  );
};

ALitCircle.displayName = 'ALitCircle';

export { ALitCircle };
