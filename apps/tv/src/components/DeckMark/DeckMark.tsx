import { View } from 'react-native';
import { deckStylesOf } from '@ValenceNative/brand/deckStylesOf';
import { useDeckFanning } from '@ValenceNative/motion/useDeckFanning';
import { tokens } from '@ValenceTv/theme/tokens';
import type { DeckMarkProps } from './DeckMark.types';

/**
 * Valence's mark as the web draws it, a deck of three cards, the smiling one in front, in the
 * television's text colour on its canvas, with the two cards behind faded into the canvas and the
 * faces cut through in it. Animated, it grows into place and fans out from under the front card.
 *
 * @param width - How wide the box it sits in is.
 * @param height - How tall the box is.
 * @param isAnimated - Whether it fans out as it arrives.
 * @param loops - Whether it goes on gathering back up and fanning out again, as it does while the
 *   television loads, starting fanned out where it does not arrive.
 * @param label - What it is read out as; omit where a name sits beside it.
 */
const DeckMark = ({ width, height, isAnimated = false, loops = false, label }: DeckMarkProps) => {
  const { progress, grows } = useDeckFanning({ arrives: isAnimated, loops });
  const styles = deckStylesOf(width, height, progress, tokens.colours.text, tokens.colours.canvas);

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

DeckMark.displayName = 'DeckMark';

export { DeckMark };
