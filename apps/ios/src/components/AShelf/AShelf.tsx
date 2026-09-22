import { ScrollView, StyleSheet, View } from 'react-native';
import { Words } from '@ValencePhone/components/Words/Words';
import type { AShelfProps } from './AShelf.types';

const styles = StyleSheet.create({
  row: { gap: 14 },
  whole: { gap: 10 },
});

/**
 * A named row of things that scrolls sideways, as every shelf of posters on a phone does.
 *
 * @param title - What the shelf is called.
 * @param children - What sits on it.
 */
const AShelf = ({ title, children }: AShelfProps) => (
  <View style={styles.whole}>
    <Words size="heading">{title}</Words>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {children}
    </ScrollView>
  </View>
);

AShelf.displayName = 'AShelf';

export { AShelf };
