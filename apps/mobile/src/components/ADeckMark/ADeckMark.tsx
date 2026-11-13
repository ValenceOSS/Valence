import { View } from 'react-native';
import { deckStylesOf } from '@ValenceNative/brand/deckStylesOf';
import { useDeckFanning } from '@ValenceNative/motion/useDeckFanning';
import type { ADeckMarkProps } from './ADeckMark.types';

/**
 * Valence's mark as the web draws it, a deck of three cards, the smiling one in front: inked in the
 * colour given, with the two behind faded into the ground and the faces cut through in it. Animated,
 * it grows into place and fans out from under the front card, as the web's splash does.
 *
 * @param width - How wide the box it sits in is.
 * @param height - How tall the box is.
 * @param ink - The colour of the front card, as `#rrggbb`.
 * @param ground - The colour behind it, as `#rrggbb`.
 * @param isAnimated - Whether it fans out as it arrives.
 * @param loops - Whether it goes on gathering back up and fanning out again, as it does while the
 *   app loads.
 * @param label - What it is read out as; omit where a name sits beside it.
 */
const ADeckMark = ({
  width,
  height,
  ink,
  ground,
  isAnimated = false,
  loops = false,
  label,
}: ADeckMarkProps) => {
  const { progress, grows } = useDeckFanning({ arrives: isAnimated, loops });
  const styles = deckStylesOf(width, height, progress, ink, ground);

  return (
    <View
      style={[styles.box, { transform: [{ scale: grows }] }]}
      {...(label === undefined
        ? {
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          }
        : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label })}
    >
      <View style={styles.deck}>
        {styles.cards.map((card, at) => (
          <View key={at} style={card.card}>
            <View style={card.face}>
              <View style={card.clip}>
                <View style={card.ring} />
              </View>
              <View style={card.caps[0]} />
              <View style={card.caps[1]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

ADeckMark.displayName = 'ADeckMark';

export { ADeckMark };
