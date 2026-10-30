import { StyleSheet, Text, View } from 'react-native';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { tokens } from '@ValenceTv/theme/tokens';
import type { GenreChipsProps } from './GenreChips.types';

const AT_MOST = 3;

/**
 * What kind of title it is, as the phone's title card sets it: the first few of its genres on soft
 * rounded chips in a row. Nothing is drawn where it has none.
 *
 * @param genres - Its genres, most fitting first.
 */
const GenreChips = ({ genres }: GenreChipsProps) => {
  if (genres.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {genres.slice(0, AT_MOST).map((genre) => (
        <View key={genre} style={styles.chip}>
          <Text style={styles.genre}>{genre}</Text>
        </View>
      ))}
    </View>
  );
};

GenreChips.displayName = 'GenreChips';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.xs },
  chip: {
    backgroundColor: withAlpha(tokens.colours.text, 0.14),
    borderRadius: tokens.radii.round,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 6,
  },
  genre: { color: tokens.colours.text, fontSize: tokens.type.small - 2, fontWeight: '600' },
});

export { GenreChips };
