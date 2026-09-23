import {
  FlatList,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from 'react-native';
import { CatalogueCard } from '@ValenceTv/components/CatalogueCard/CatalogueCard';
import { cardSizes } from '@ValenceTv/components/MediaCard/cardSizes';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CatalogueShelfProps } from './CatalogueShelf.types';

/**
 * A named row of films and shows from the film database, for the remote to move along — what is
 * trending, what is popular, what is coming soon — each one there to be looked at and asked for.
 *
 * Like the library's shelves it catches the remote across the whole width of the screen, and builds
 * only the posters that fit and one more.
 *
 * @param title - What the row is.
 * @param titles - What is on it.
 * @param onOpen - Told which was chosen.
 */
const CatalogueShelf = ({ title, titles, onOpen }: CatalogueShelfProps) => {
  const screen = useWindowDimensions();
  const inView = Math.ceil(screen.width / (cardSizes.poster.width + tokens.space.md)) + 1;

  return (
    <View style={styles.shelf}>
      <Text style={styles.title}>{title}</Text>

      <TVFocusGuideView autoFocus>
        <FlatList
          horizontal
          initialNumToRender={inView}
          maxToRenderPerBatch={inView}
          windowSize={3}
          removeClippedSubviews={false}
          data={titles}
          keyExtractor={(one) => `${one.kind}:${one.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inside}
          style={styles.row}
          renderItem={({ item }) => <CatalogueCard title={item} onPress={onOpen} />}
        />
      </TVFocusGuideView>
    </View>
  );
};

CatalogueShelf.displayName = 'CatalogueShelf';

const styles = StyleSheet.create({
  shelf: { gap: tokens.space.xs },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  row: { overflow: 'visible' },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.md,
    gap: tokens.space.md,
  },
});

export { CatalogueShelf };
