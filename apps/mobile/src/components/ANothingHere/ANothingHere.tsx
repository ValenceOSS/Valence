import { StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ANothingHereProps } from './ANothingHere.types';

const styles = StyleSheet.create({
  said: { alignItems: 'center', gap: 6 },
  whole: { alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 72 },
});

/**
 * Says why a screen is empty, in the one shape the web's empty screens use: a faint picture of what
 * is missing, what is missing in a few words, and what would change it.
 *
 * @param of - The icon to draw above it.
 * @param title - What is missing.
 * @param detail - Why, and what would change it, where the title does not already say it.
 */
const ANothingHere = ({ of, title, detail }: ANothingHereProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.whole}>
      <Icon of={of} size={52} colour={withAlpha(colours.textMuted, 0.6)} />

      <View style={styles.said}>
        <Words size="heading" isCentred>
          {title}
        </Words>
        {detail === undefined ? null : (
          <Words tone="muted" isCentred>
            {detail}
          </Words>
        )}
      </View>
    </View>
  );
};

ANothingHere.displayName = 'ANothingHere';

export { ANothingHere };
