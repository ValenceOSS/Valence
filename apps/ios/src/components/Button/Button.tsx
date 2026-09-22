import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ButtonProps } from './Button.types';

const styles = StyleSheet.create({
  accent: { alignItems: 'center', borderRadius: 14, padding: 16 },
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
 * @param children - What it says.
 * @param onPress - What it does.
 * @param tone - Whether it is the thing to press or merely a thing that can be.
 * @param isBusy - Whether what it started is still going.
 * @param isDisabled - Whether it can be pressed at all.
 * @param label - What it is called, where what it says is not enough.
 */
const Button = ({
  children,
  onPress,
  tone = 'accent',
  isBusy = false,
  isDisabled = false,
  label,
}: ButtonProps) => {
  const colours = useTheColours();
  const isAccent = tone === 'accent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled || isBusy, busy: isBusy }}
      disabled={isDisabled || isBusy}
      onPress={onPress}
      style={({ pressed }) => [
        isAccent ? styles.accent : styles.quiet,
        isAccent && { backgroundColor: colours.accent },
        pressed && styles.pressed,
        isDisabled && styles.pressed,
      ]}
      {...(label === undefined ? {} : { accessibilityLabel: label })}
    >
      {isBusy ? (
        <ActivityIndicator color={isAccent ? colours.accentContrast : colours.accent} />
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
