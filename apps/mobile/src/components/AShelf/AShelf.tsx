import { Children, isValidElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ACardArrival } from '@ValenceMobile/components/ACardArrival/ACardArrival';
import { Words } from '@ValenceMobile/components/Words/Words';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Button } from '@ValenceMobile/components/Button/Button';
import type { AShelfProps } from './AShelf.types';
import { say } from '@ValenceI18n/say';

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

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleeding}
      contentContainerStyle={styles.row}
    >
      {Children.toArray(children).map((card, at) => (
        <ACardArrival key={isValidElement(card) && card.key !== null ? card.key : at} at={at}>
          {card}
        </ACardArrival>
      ))}
    </ScrollView>
  </View>
);

AShelf.displayName = 'AShelf';

export { AShelf };
