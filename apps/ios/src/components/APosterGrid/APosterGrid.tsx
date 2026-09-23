import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POSTER_WIDTH } from '@ValencePhone/components/APoster/POSTER_WIDTH';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { AnArrival } from '@ValencePhone/components/AnArrival/AnArrival';
import { BackArrow } from '@ValencePhone/components/BackArrow/BackArrow';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { APosterGridProps } from './APosterGrid.types';

const GAP = 18;

const SCROLLED = 4;

const CLEAR_OF_THE_ARROW = 56;

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
 * @param across - How many to a row, where it is not as many posters as fit; each is then told how
 *   wide its column is, so a grid of albums fills the screen rather than leaving a gap at its edge.
 * @param onScrolled - Told whether it has been scrolled from its top.
 * @param onBack - Told somebody is done with it, for a grid that is a page of its own rather than a
 *   part of the library, which then has the way back and the page's own ground behind it.
 */
const APosterGrid = <Item,>({
  header,
  items,
  keyOf,
  drawn,
  across: asked,
  onScrolled,
  onBack,
}: APosterGridProps<Item>) => {
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const across =
    asked ?? Math.max(1, Math.floor((width - SCREEN_EDGE * 2 + GAP) / (POSTER_WIDTH + GAP)));
  const cell = (width - SCREEN_EDGE * 2 - GAP * (across - 1)) / across;

  const grid = (
    <FlatList
      key={across}
      data={items}
      numColumns={across}
      keyExtractor={keyOf}
      renderItem={({ item }) => <AnArrival>{drawn(item, cell)}</AnArrival>}
      ListHeaderComponent={<View style={styles.header}>{header}</View>}
      {...(across > 1 ? { columnWrapperStyle: styles.row } : {})}
      contentContainerStyle={{
        gap: GAP,
        paddingBottom: room.bottom + SCREEN_EDGE,
        paddingHorizontal: SCREEN_EDGE,
        paddingTop: room.top + (onBack === undefined ? SCREEN_EDGE : CLEAR_OF_THE_ARROW),
      }}
      style={styles.whole}
      keyboardShouldPersistTaps="handled"
      refreshControl={pulling}
      scrollEventThrottle={16}
      onScroll={({ nativeEvent }) => {
        onScrolled?.(nativeEvent.contentOffset.y > SCROLLED);
      }}
    />
  );

  if (onBack === undefined) {
    return grid;
  }

  return (
    <View style={[styles.whole, { backgroundColor: colours.surface }]}>
      {grid}
      <BackArrow onBack={onBack} />
    </View>
  );
};

APosterGrid.displayName = 'APosterGrid';

export { APosterGrid };
