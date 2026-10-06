import { Animated, StyleSheet } from 'react-native';
import type { StretchPillProps } from './StretchPill.types';

const MIDDLE = 100;

/**
 * A pill that slides and stretches without being laid out again: a round end at each side and a
 * bar between them, each moved and the bar stretched by a transform the native side runs, so its
 * place and its width can spring from one tab or dot to the next on every television.
 *
 * Its parts overlap where they meet, so a pill drawn see-through is drawn solid inside a group made
 * see-through as a whole.
 *
 * @param x - Where its left edge is.
 * @param width - How wide it is, never less than its height.
 * @param height - How tall it is, which is also how wide each round end is.
 * @param colour - What it is filled with.
 */
const StretchPill = ({ x, width, height, colour }: StretchPillProps) => {
  const part = { height, backgroundColor: colour };
  const end = { ...part, width: height, borderRadius: height / 2 };

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.part,
          part,
          {
            width: MIDDLE,
            transform: [
              {
                translateX: Animated.add(
                  x,
                  Animated.add(Animated.multiply(width, 0.5), -MIDDLE / 2),
                ),
              },
              { scaleX: Animated.multiply(Animated.add(width, -height), 1 / MIDDLE) },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.part, end, { transform: [{ translateX: x }] }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.part,
          end,
          { transform: [{ translateX: Animated.add(x, Animated.add(width, -height)) }] },
        ]}
      />
    </>
  );
};

StretchPill.displayName = 'StretchPill';

const styles = StyleSheet.create({
  part: { position: 'absolute', top: 0, left: 0 },
});

export { StretchPill };
