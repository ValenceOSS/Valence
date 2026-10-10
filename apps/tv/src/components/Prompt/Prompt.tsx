import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PromptProps } from './Prompt.types';

const WIDTH = 880;

/**
 * A question in the middle of the screen over a dimmed page, with its answers as buttons side by
 * side, as a television asks one of its own.
 *
 * The remote starts on the answer that changes nothing, and stays among the answers until one is
 * chosen. Back answers that way too.
 *
 * @param prompt - What is asked, and the answers.
 * @param onAnswered - Told once any answer is chosen, before what it does.
 */
const Prompt = ({ prompt, onAnswered }: PromptProps) => {
  const cancel = prompt.buttons.find((button) => button.style === 'cancel') ?? null;
  const startsOn = cancel ?? prompt.buttons[0] ?? null;

  useMenuButton(() => {
    onAnswered();
    cancel?.onPress?.();
  }, true);

  return (
    <View style={styles.scrim}>
      <View style={styles.card} accessibilityRole="alert">
        <Text style={styles.title}>{prompt.title}</Text>
        {prompt.message === undefined || prompt.message === '' ? null : (
          <Text style={styles.message}>{prompt.message}</Text>
        )}

        <FocusGuide trapsUp trapsDown trapsLeft trapsRight style={styles.answers}>
          {prompt.buttons.map((button) => (
            <Button
              key={button.text}
              label={button.text}
              variant={
                button.style === 'destructive'
                  ? 'danger'
                  : button === startsOn
                    ? 'primary'
                    : 'secondary'
              }
              hasPreferredFocus={button === startsOn}
              onPress={() => {
                onAnswered();
                button.onPress?.();
              }}
            />
          ))}
        </FocusGuide>
      </View>
    </View>
  );
};

Prompt.displayName = 'Prompt';

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  card: {
    width: WIDTH,
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radii.xl,
    backgroundColor: tokens.colours.raised,
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '700' },
  message: { color: tokens.colours.muted, fontSize: tokens.type.body, lineHeight: 38 },
  answers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
    marginTop: tokens.space.sm,
  },
});

export { Prompt };
