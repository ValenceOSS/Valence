import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Words } from '@ValenceMobile/components/Words/Words';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { AWrittenNameProps } from './AWrittenName.types';

const LETTER_AFTER = 45;

const FIRST_AFTER = 180;

const RISE = 8;

const WRITTEN = { once: false };

const styles = StyleSheet.create({
  name: { flexDirection: 'row' },
});

/**
 * The name beside the mark at the top of the library, writing itself in as the web's bar does: each
 * letter rising into place after the one before, once the mark has landed. It is written once each
 * time the app opens, and after that, or for somebody who asked for less motion, it is simply there.
 *
 * @param name - The name to write.
 */
const AWrittenName = ({ name }: AWrittenNameProps) => {
  const isStill = usePrefersStillness();
  const [isWritten] = useState(() => WRITTEN.once || isStill);
  const [letters] = useState(() => [...name].map(() => new Animated.Value(isWritten ? 1 : 0)));

  useEffect(() => {
    if (isWritten) {
      return undefined;
    }

    WRITTEN.once = true;

    const writing = Animated.parallel(
      letters.map((letter, at) =>
        Animated.spring(letter, {
          toValue: 1,
          ...SPRINGS.letter,
          delay: FIRST_AFTER + at * LETTER_AFTER,
          useNativeDriver: true,
        }),
      ),
    );

    writing.start();

    return () => {
      writing.stop();
    };
  }, [letters, isWritten]);

  return (
    <View style={styles.name} accessible accessibilityLabel={name}>
      {[...name].map((letter, at) => {
        const arriving = letters[at] ?? new Animated.Value(1);

        return (
          <Animated.View
            key={`${letter}-${at.toString()}`}
            style={{
              opacity: arriving,
              transform: [
                {
                  translateY: arriving.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] }),
                },
              ],
            }}
          >
            <Words size="heading">{letter}</Words>
          </Animated.View>
        );
      })}
    </View>
  );
};

AWrittenName.displayName = 'AWrittenName';

export { AWrittenName };
