import { useCallback, useMemo, useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { ACardArrival } from '@ValenceMobile/components/ACardArrival/ACardArrival';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { CARD_GAP } from '@ValenceMobile/components/AShelf/CARD_GAP';
import { cardsLaidOut } from '@ValenceMobile/components/AShelf/cardsLaidOut';
import type { AShelfRowProps } from './AShelfRow.types';

const FIRST_CARDS = 4;

const CARDS_A_BATCH = 4;

const SCREENFULS_KEPT = 3;

const styles = StyleSheet.create({
  bleeding: { marginHorizontal: -SCREEN_EDGE },
  row: { gap: CARD_GAP, paddingHorizontal: SCREEN_EDGE },
});

/**
 * The row of a shelf, scrolling sideways and drawing only the cards on screen and a little either
 * side, each arriving the first time it is drawn and simply there when it is scrolled back to.
 *
 * @param items - What there is a card for.
 * @param keyOf - What tells one from another.
 * @param drawn - Draws one.
 * @param cardWidth - How wide every card is, where they are all one width, so none is measured.
 */
const AShelfRow = <Item,>({ items, keyOf, drawn, cardWidth }: AShelfRowProps<Item>) => {
  const arrived = useRef(new Set<string>());

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Item>) => {
      const key = keyOf(item, index);

      return (
        <ACardArrival
          at={index}
          isArrived={arrived.current.has(key)}
          onArrived={() => {
            arrived.current.add(key);
          }}
        >
          {drawn(item, index)}
        </ACardArrival>
      );
    },
    [keyOf, drawn],
  );

  const getItemLayout = useMemo(
    () => (cardWidth === undefined ? undefined : cardsLaidOut<Item>(cardWidth)),
    [cardWidth],
  );

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={keyOf}
      renderItem={renderItem}
      {...(getItemLayout === undefined ? {} : { getItemLayout })}
      initialNumToRender={FIRST_CARDS}
      maxToRenderPerBatch={CARDS_A_BATCH}
      windowSize={SCREENFULS_KEPT}
      removeClippedSubviews
      showsHorizontalScrollIndicator={false}
      style={styles.bleeding}
      contentContainerStyle={styles.row}
    />
  );
};

AShelfRow.displayName = 'AShelfRow';

export { AShelfRow };
