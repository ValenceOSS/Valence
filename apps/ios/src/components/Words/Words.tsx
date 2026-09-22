import { StyleSheet, Text } from 'react-native';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { WordsProps } from './Words.types';

const ON_ARTWORK = '#ffffff';

const ON_BRIGHT = '#000000';

const styles = StyleSheet.create({
  body: { fontSize: 15 },
  heading: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2 },
  small: { fontSize: 12 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
});

/**
 * Anything written on a phone, at one of the four sizes there turned out to be.
 *
 * Four rather than a scale, because a scale invites a fifth and then the screens stop agreeing. The
 * fourth arrived with rows: a row needs a name that is clearly not the page's own, and neither the
 * page's title nor the words under it would do.
 *
 * @param children - What it says.
 * @param tone - How much it wants to be read.
 * @param size - How large it is.
 * @param lines - How many lines it may take before it is cut short.
 */
const Words = ({ children, tone = 'plain', size = 'body', lines }: WordsProps) => {
  const colours = useTheColours();
  const colour =
    tone === 'muted'
      ? colours.textMuted
      : tone === 'danger'
        ? colours.danger
        : tone === 'accent'
          ? colours.accent
          : tone === 'onArtwork'
            ? ON_ARTWORK
            : tone === 'onBright'
              ? ON_BRIGHT
              : colours.text;

  return (
    <Text
      style={[
        size === 'title'
          ? styles.title
          : size === 'heading'
            ? styles.heading
            : size === 'small'
              ? styles.small
              : styles.body,
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
