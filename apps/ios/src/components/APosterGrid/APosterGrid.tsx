import { useCallback, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GRID_GAP } from '@ValencePhone/components/APosterGrid/GRID_GAP';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { useGridCells } from '@ValencePhone/hooks/useGridCells';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { AnArrival } from '@ValencePhone/components/AnArrival/AnArrival';
import { BackArrow } from '@ValencePhone/components/BackArrow/BackArrow';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { APosterGridProps } from './APosterGrid.types';

const SCROLLED = 4;

const CLEAR_OF_THE_ARROW = 56;

const styles = StyleSheet.create({
  footer: { paddingTop: 20 },
  header: { gap: 20 },
  row: { gap: GRID_GAP },
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
 * @param onScrolledTo - Told how far down it has been scrolled, as it scrolls.
 * @param onNearTheEnd - Told the end is coming into view, to fetch what follows.
 * @param footer - What goes after the last row, such as a sign that more is on its way.
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
  onScrolledTo,
  onNearTheEnd,
  footer,
  onBack,
}: APosterGridProps<Item>) => {
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const colours = useTheColours();
  const { across, cell } = useGridCells(asked);
  const wasScrolled = useRef<boolean | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => <AnArrival>{drawn(item, cell)}</AnArrival>,
    [drawn, cell],
  );

  const head = useMemo(() => <View style={styles.header}>{header}</View>, [header]);

  const spacing = useMemo(
    () => ({
      gap: GRID_GAP,
      paddingBottom: room.bottom + SCREEN_EDGE,
      paddingHorizontal: SCREEN_EDGE,
      paddingTop: room.top + (onBack === undefined ? SCREEN_EDGE : CLEAR_OF_THE_ARROW),
    }),
    [room.bottom, room.top, onBack],
  );

  const onScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const isScrolled = nativeEvent.contentOffset.y > SCROLLED;

      onScrolledTo?.(nativeEvent.contentOffset.y);

      if (isScrolled !== wasScrolled.current) {
        wasScrolled.current = isScrolled;
        onScrolled?.(isScrolled);
      }
    },
    [onScrolled, onScrolledTo],
  );

  const grid = (
    <FlatList
      key={across}
      data={items}
      numColumns={across}
      keyExtractor={keyOf}
      renderItem={renderItem}
      ListHeaderComponent={head}
      {...(across > 1 ? { columnWrapperStyle: styles.row } : {})}
      contentContainerStyle={spacing}
      style={styles.whole}
      keyboardShouldPersistTaps="handled"
      refreshControl={pulling}
      scrollEventThrottle={16}
      onScroll={onScroll}
      {...(onNearTheEnd === undefined
        ? {}
        : { onEndReached: onNearTheEnd, onEndReachedThreshold: 1.5 })}
      {...(footer === undefined
        ? {}
        : { ListFooterComponent: <View style={styles.footer}>{footer}</View> })}
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
