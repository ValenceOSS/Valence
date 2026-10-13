import { StyleSheet, View } from 'react-native';
import { ALetter } from './components/ALetter/ALetter';
import type { AWordOpeningProps } from './AWordOpening.types';

const FIRST_WAITS = 80;

const LETTER_STEP = 35;

const styles = StyleSheet.create({
  letters: { flexDirection: 'row' },
});

/**
 * A word written out beside whatever stands before it once told to, as the web's opens out: its
 * letters rising into place one after another. It says how wide it is, so whatever holds it can
 * slide over to make room as it arrives, which a phone draws more smoothly than room that grows.
 * Hidden from screen readers, since what it spells is said once elsewhere.
 *
 * @param word - The word.
 * @param isShown - Whether it has been written out yet.
 * @param isStill - Whether it should simply be there, for somebody who asked for less motion.
 * @param style - How its letters are set.
 * @param before - The room left between it and whatever stands before it.
 * @param onWide - Told how wide it is, room before it included.
 */
const AWordOpening = ({ word, isShown, isStill, style, before, onWide }: AWordOpeningProps) => (
  <View
    style={[styles.letters, { paddingLeft: before }]}
    onLayout={(event) => {
      onWide(event.nativeEvent.layout.width);
    }}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    {[...word].map((letter, at) => (
      <ALetter
        key={`${letter}-${at.toString()}`}
        letter={letter}
        isShown={isShown}
        waitsFor={FIRST_WAITS + at * LETTER_STEP}
        isStill={isStill}
        style={style}
      />
    ))}
  </View>
);

AWordOpening.displayName = 'AWordOpening';

export { AWordOpening };
