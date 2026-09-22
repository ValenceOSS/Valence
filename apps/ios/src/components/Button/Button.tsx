import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ButtonProps } from './Button.types';

const styles = StyleSheet.create({
  accent: { alignItems: 'center', borderRadius: 14, padding: 16 },
  bare: {},
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  pressed: { opacity: 0.75 },
  quiet: { alignItems: 'center', paddingVertical: 12 },
  word: { fontSize: 16, fontWeight: '600' },
  quietWord: { fontSize: 15, fontWeight: '500' },
});

/**
 * The only thing on a phone that owns a press.
 *
 * `Pressable` lives here and nowhere else, which is the same rule the browser client keeps about
 * `<button>` — a control that draws itself is a control that drifts, and a household looking at two
 * clients should not be able to tell which one somebody built first.
 *
 * A bare one draws nothing and says nothing about what it holds, which is how a poster or a pill
 * becomes pressable without a second component learning how to take a press.
 *
 * @param children - What it says.
 * @param onPress - What it does.
 * @param tone - Whether it is the thing to press, a thing that can be, or only the press itself.
 * @param fills - Whether it takes up the whole of whatever holds it, for a press area with no
 *   shape of its own — the picture a film is playing on, which is pressed to put the controls away.
 * @param isBusy - Whether what it started is still going.
 * @param isDisabled - Whether it can be pressed at all.
 * @param isChosen - Whether this is the one currently picked, where it is one of several.
 * @param label - What it is called, where what it says is not enough.
 */
const Button = ({
  children,
  onPress,
  tone = 'accent',
  fills = false,
  isBusy = false,
  isDisabled = false,
  isChosen,
  label,
}: ButtonProps) => {
  const colours = useTheColours();
  const isAccent = tone === 'accent';
  const isBare = tone === 'bare';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled || isBusy,
        busy: isBusy,
        ...(isChosen === undefined ? {} : { selected: isChosen }),
      }}
      disabled={isDisabled || isBusy}
      onPress={onPress}
      style={({ pressed }) => [
        isBare ? styles.bare : isAccent ? styles.accent : styles.quiet,
        fills && styles.fills,
        isAccent && { backgroundColor: colours.accent },
        pressed && styles.pressed,
        isDisabled && styles.pressed,
      ]}
      {...(label === undefined ? {} : { accessibilityLabel: label })}
    >
      {isBusy ? (
        <ActivityIndicator color={isAccent ? colours.accentContrast : colours.accent} />
      ) : isBare ? (
        children
      ) : (
        <Text
          style={[
            isAccent ? styles.word : styles.quietWord,
            { color: isAccent ? colours.accentContrast : colours.accent },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
};

Button.displayName = 'Button';

export { Button };
