import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { readableParts } from '@ValenceTv/library/readableParts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { BiographyReaderProps } from './BiographyReader.types';
import { say } from '@ValenceI18n/say';

/**
 * Somebody's whole biography over their page, for reading from the sofa: their name at its head and
 * what the catalogue says of them beneath, a paragraph at a time, a long one broken between its
 * sentences so every line can be reached. The remote moves down through the paragraphs, the one it
 * is on lit and the rest dimmed, and the page scrolls with it, since a remote scrolls a
 * television's page only by moving between things. Back closes it.
 *
 * @param name - Whose biography it is.
 * @param biography - The whole of it.
 * @param onClose - Told to close it.
 */
const BiographyReader = ({ name, biography, onClose }: BiographyReaderProps) => {
  const paragraphs = readableParts(biography);

  useMenuButton(onClose, true);

  return (
    <View style={styles.scrim}>
      <View style={styles.column}>
        <Text style={styles.heading}>{say('common.aboutName', { name })}</Text>

        <FocusGuide trapsUp trapsDown trapsLeft trapsRight style={styles.reading}>
          <ScrollView style={styles.reading} contentContainerStyle={styles.inside}>
            {paragraphs.map((paragraph, at) => (
              <Focusable key={at} label={paragraph} scale={1} hasPreferredFocus={at === 0}>
                {(isFocused) => (
                  <Text style={[styles.paragraph, isFocused && styles.lit]}>{paragraph}</Text>
                )}
              </Focusable>
            ))}
          </ScrollView>
        </FocusGuide>
      </View>
    </View>
  );
};

BiographyReader.displayName = 'BiographyReader';

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    backgroundColor: withAlpha(tokens.colours.canvas, 0.94),
  },
  column: {
    flex: 1,
    width: 1200,
    gap: tokens.space.lg,
    paddingTop: tokens.space.xl + tokens.space.lg,
  },
  heading: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  reading: { flex: 1 },
  inside: { gap: tokens.space.md, paddingBottom: tokens.space.xl * 3 },
  paragraph: { color: tokens.colours.muted, fontSize: tokens.type.body, lineHeight: 44 },
  lit: { color: tokens.colours.text },
});

export { BiographyReader };
