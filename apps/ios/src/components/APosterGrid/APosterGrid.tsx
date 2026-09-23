import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POSTER_WIDTH } from '@ValencePhone/components/APoster/POSTER_WIDTH';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import type { APosterGridProps } from './APosterGrid.types';

const GAP = 18;

const styles = StyleSheet.create({
  header: { gap: 20 },
  row: { gap: GAP },
  whole: { flex: 1 },
});

/**
 * A screen that is a grid of posters, under whatever heads it, drawing only the rows in view.
 *
 * A library of thousands is drawn as quickly as one of ten, because the rows scrolled past are let
 * go and the rows not yet reached are not drawn. It fits as many posters across as the phone is
 * wide, and lays the header out as a screen would, so it sits among the other screens unnoticed.
 *
 * @param header - What sits above the posters and scrolls away with them.
 * @param items - What there is a poster for.
 * @param keyOf - What tells one from another.
 * @param drawn - Draws one.
 */
const APosterGrid = <Item,>({ header, items, keyOf, drawn }: APosterGridProps<Item>) => {
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const { width } = useWindowDimensions();
  const across = Math.max(1, Math.floor((width - SCREEN_EDGE * 2 + GAP) / (POSTER_WIDTH + GAP)));

  return (
    <FlatList
      key={across}
      data={items}
      numColumns={across}
      keyExtractor={keyOf}
      renderItem={({ item }) => <>{drawn(item)}</>}
      ListHeaderComponent={<View style={styles.header}>{header}</View>}
      {...(across > 1 ? { columnWrapperStyle: styles.row } : {})}
      contentContainerStyle={{
        gap: GAP,
        paddingBottom: room.bottom + SCREEN_EDGE,
        paddingHorizontal: SCREEN_EDGE,
        paddingTop: room.top + SCREEN_EDGE,
      }}
      style={styles.whole}
      keyboardShouldPersistTaps="handled"
      refreshControl={pulling}
    />
  );
};

APosterGrid.displayName = 'APosterGrid';

export { APosterGrid };
