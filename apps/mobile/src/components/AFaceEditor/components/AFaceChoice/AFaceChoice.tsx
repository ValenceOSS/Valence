import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { AFaceChoiceProps } from './AFaceChoice.types';

const SIDE = 64;

const RING = 2;

const styles = StyleSheet.create({
  choice: { alignItems: 'center', gap: 6, width: 86 },
  circle: {
    alignItems: 'center',
    borderRadius: SIDE / 2,
    height: SIDE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: SIDE,
  },
  ring: { borderRadius: SIDE / 2 + RING * 2, borderWidth: RING, padding: RING },
});

/**
 * One choice in a row of them in the picture editor, as the web draws it: a circle showing what it
 * makes, ringed in the accent while it is the one chosen, with its name beneath. One that cannot be
 * chosen yet is an empty circle.
 *
 * @param label - What a reader is told choosing it does.
 * @param name - Its name, shown beneath it.
 * @param isChosen - Whether it is the one chosen.
 * @param isDisabled - Whether it cannot be chosen yet.
 * @param onChoose - Told it was chosen.
 * @param children - What the circle shows.
 */
const AFaceChoice = ({
  label,
  name,
  isChosen,
  isDisabled = false,
  onChoose,
  children,
}: AFaceChoiceProps) => {
  const colours = useTheColours();
  const isMarked = isChosen && !isDisabled;

  return (
    <Button
      tone="bare"
      label={label}
      isChosen={isMarked}
      isDisabled={isDisabled}
      onPress={onChoose}
    >
      <View style={styles.choice}>
        <View style={[styles.ring, { borderColor: isMarked ? colours.accent : 'transparent' }]}>
          <View style={[styles.circle, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
            {isDisabled ? null : children}
          </View>
        </View>
        <Words size="small" tone={isMarked ? 'plain' : 'muted'} lines={1}>
          {name}
        </Words>
      </View>
    </Button>
  );
};

AFaceChoice.displayName = 'AFaceChoice';

export { AFaceChoice };
