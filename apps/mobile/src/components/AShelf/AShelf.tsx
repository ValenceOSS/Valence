import { Children, isValidElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { ACardArrival } from '@ValenceMobile/components/ACardArrival/ACardArrival';
import { Words } from '@ValenceMobile/components/Words/Words';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Button } from '@ValenceMobile/components/Button/Button';
import type { AShelfProps } from './AShelf.types';
import { say } from '@ValenceI18n/say';

const FIRST_CARDS = 4;

const CARDS_A_BATCH = 4;

const SCREENFULS_KEPT = 3;

/**
 * The key a card on a shelf is drawn under: the one it was given, or its place where it has none.
 *
 * @param card - The card.
 * @param at - Where it sits on the shelf.
 * @returns Its key.
 */
const keyOfCard = (card: ReactNode, at: number): string =>
  isValidElement(card) && card.key !== null ? card.key : at.toString();

const styles = StyleSheet.create({
  bleeding: { marginHorizontal: -SCREEN_EDGE },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  row: { gap: 14, paddingHorizontal: SCREEN_EDGE },
  whole: { gap: 10 },
});

/**
 * A named row of things that scrolls sideways, as every shelf of posters on a phone does.
 *
 * The row runs past the page's margins to the edges of the screen, starting in line with everything
 * else and scrolling off the side, so a card cut by the edge says there is more rather than a card
 * cut by a margin looking like a mistake.
 *
 * Only the cards on screen and a little either side are drawn. A shelf of forty titles used to draw
 * all forty, pictures and all, when three fit on a phone, which was most of what a home page cost.
 *
 * @param title - What the shelf is called.
 * @param onSeeAll - Told somebody wants everything the shelf only shows the start of, where it does.
 * @param children - What sits on it.
 */
const AShelf = ({ title, onSeeAll, children }: AShelfProps) => (
  <View style={styles.whole}>
    <View style={styles.head}>
      <Words size="heading">{title}</Words>
      {onSeeAll === undefined ? null : (
        <Button
          tone="quiet"
          label={say('phone.aShelf.seeAllTitle', { title: title.toLowerCase() })}
          onPress={onSeeAll}
        >
          {say('common.seeAll')}
        </Button>
      )}
    </View>

    <FlatList
      horizontal
      data={Children.toArray(children)}
      keyExtractor={keyOfCard}
      renderItem={({ item, index }) => <ACardArrival at={index}>{item}</ACardArrival>}
      initialNumToRender={FIRST_CARDS}
      maxToRenderPerBatch={CARDS_A_BATCH}
      windowSize={SCREENFULS_KEPT}
      showsHorizontalScrollIndicator={false}
      style={styles.bleeding}
      contentContainerStyle={styles.row}
    />
  </View>
);

AShelf.displayName = 'AShelf';

export { AShelf };
