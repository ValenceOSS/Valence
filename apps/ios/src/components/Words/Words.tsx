import { StyleSheet, Text } from 'react-native';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { WordsProps } from './Words.types';

const styles = StyleSheet.create({
  body: { fontSize: 15 },
  small: { fontSize: 12 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
});

/**
 * Anything written on a phone, at one of the three sizes there turned out to be.
 *
 * Three rather than a scale, because a scale invites a fourth and then the screens stop agreeing.
 *
 * @param children - What it says.
 * @param tone - How much it wants to be read.
 * @param size - How large it is.
 * @param lines - How many lines it may take before it is cut short.
 */
const Words = ({ children, tone = 'plain', size = 'body', lines }: WordsProps) => {
  const colours = useTheColours();
  const colour =
    tone === 'muted' ? colours.textMuted : tone === 'danger' ? colours.danger : colours.text;

  return (
    <Text
      style={[
        size === 'title' ? styles.title : size === 'small' ? styles.small : styles.body,
        { color: colour },
      ]}
      {...(lines === undefined ? {} : { numberOfLines: lines })}
    >
      {children}
    </Text>
  );
};

Words.displayName = 'Words';

export { Words };
