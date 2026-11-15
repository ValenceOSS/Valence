import { Children, isValidElement } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { AShelfRow } from '@ValenceMobile/components/AShelf/components/AShelfRow/AShelfRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { Button } from '@ValenceMobile/components/Button/Button';
import type { AShelfProps } from './AShelf.types';
import { say } from '@ValenceI18n/say';

/**
 * The key a card on a shelf is drawn under: the one it was given, or its place where it has none.
 *
 * @param card - The card.
 * @param at - Where it sits on the shelf.
 * @returns Its key.
 */
const keyOfCard = (card: ReactNode, at: number): string =>
  isValidElement(card) && card.key !== null ? card.key : at.toString();

/**
 * A card handed to a shelf already drawn, as it was handed.
 *
 * @param card - The card.
 * @returns The card.
 */
const asItWasHanded = (card: ReactNode): ReactNode => card;

const styles = StyleSheet.create({
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
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
 * It is handed either its cards already drawn, or what they are for and how to draw one. The second
 * draws a card only when it scrolls into view and draws it again only when what it is for changes,
 * where cards handed already drawn are all drawn again whenever the shelf is.
 *
 * @param props - What the shelf is called, what to do where somebody wants everything it only shows
 *   the start of, and either its cards or what they are for, what tells them apart, how to draw one
 *   and, where they are all one width, how wide.
 */
const AShelf = <Item,>(props: AShelfProps<Item>) => (
  <View style={styles.whole}>
    <View style={styles.head}>
      <Words size="heading">{props.title}</Words>
      {props.onSeeAll === undefined ? null : (
        <Button
          tone="quiet"
          label={say('phone.aShelf.seeAllTitle', { title: props.title.toLowerCase() })}
          onPress={props.onSeeAll}
        >
          {say('common.seeAll')}
        </Button>
      )}
    </View>

    {props.items === undefined ? (
      <AShelfRow items={Children.toArray(props.children)} keyOf={keyOfCard} drawn={asItWasHanded} />
    ) : (
      <AShelfRow
        items={props.items}
        keyOf={props.keyOf}
        drawn={props.drawn}
        {...(props.cardWidth === undefined ? {} : { cardWidth: props.cardWidth })}
      />
    )}
  </View>
);

AShelf.displayName = 'AShelf';

export { AShelf };
