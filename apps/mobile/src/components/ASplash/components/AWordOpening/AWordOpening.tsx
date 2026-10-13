import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ALetter } from './components/ALetter/ALetter';
import type { AWordOpeningProps } from './AWordOpening.types';

const FIRST_WAITS = 80;

const LETTER_STEP = 35;

const LAID_OUT_WITHIN = 2000;

const styles = StyleSheet.create({
  letters: { alignSelf: 'flex-start', flexDirection: 'row' },
  lays: { left: 0, position: 'absolute', top: 0, width: LAID_OUT_WITHIN },
  room: { overflow: 'hidden' },
});

/**
 * A word that opens out beside whatever stands before it once told to, as the web's does: the
 * room for it springing open and its letters rising into place one after another. Hidden from
 * screen readers, since what it spells is said once elsewhere.
 *
 * @param word - The word.
 * @param isShown - Whether it has opened yet.
 * @param isStill - Whether it should simply be there, for somebody who asked for less motion.
 * @param style - How its letters are set.
 * @param before - The room left between it and whatever stands before it.
 */
const AWordOpening = ({ word, isShown, isStill, style, before }: AWordOpeningProps) => {
  const [wide, setWide] = useState(0);
  const [high, setHigh] = useState(0);
  const [opened] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (wide === 0) {
      return undefined;
    }

    const to = isShown ? wide : 0;

    if (isStill) {
      opened.setValue(to);

      return undefined;
    }

    const opening = Animated.spring(opened, {
      toValue: to,
      stiffness: 260,
      damping: 24,
      mass: 1,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 2,
      useNativeDriver: false,
    });

    opening.start();

    return () => {
      opening.stop();
    };
  }, [isShown, isStill, wide, opened]);

  return (
    <Animated.View
      style={[styles.room, { height: high, width: opened }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.lays}>
        <View
          style={[styles.letters, { paddingLeft: before }]}
          onLayout={(event) => {
            setWide(event.nativeEvent.layout.width);
            setHigh(event.nativeEvent.layout.height);
          }}
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
      </View>
    </Animated.View>
  );
};

AWordOpening.displayName = 'AWordOpening';

export { AWordOpening };
