import { StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ALitCircleProps } from './ALitCircle.types';

const ROOM = 18;

const styles = StyleSheet.create({
  round: { alignItems: 'center', justifyContent: 'center' },
});

/**
 * The icon of a button that is on or off — shuffle, repeat, the words — drawn as the Apple TV app
 * draws one that is on: in a circle of the page's own ink, the icon cut out of it in the page's
 * colour. Off, it is the icon alone, muted.
 *
 * The circle is always there and only shown or hidden, never added: Android draws a colour put
 * behind a rounded view after it first appears as a square.
 *
 * @param of - Which icon.
 * @param size - How big the icon is; the circle leaves room around it.
 * @param isLit - Whether it is on.
 */
const ALitCircle = ({ of, size, isLit }: ALitCircleProps) => {
  const colours = useTheColours();
  const across = size + ROOM;

  return (
    <View style={[styles.round, { borderRadius: across / 2, height: across, width: across }]}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colours.accent, borderRadius: across / 2, opacity: isLit ? 1 : 0 },
        ]}
      />
      <Icon of={of} size={size} colour={isLit ? colours.accentContrast : colours.textMuted} />
    </View>
  );
};

ALitCircle.displayName = 'ALitCircle';

export { ALitCircle };
