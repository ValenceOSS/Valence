import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { AFadedEdge } from '@ValenceMobile/components/AFadedEdge/AFadedEdge';
import { ACapsuleRow } from '@ValenceMobile/components/SegmentedRow/components/ACapsuleRow/ACapsuleRow';
import type { SegmentedRowProps } from './SegmentedRow.types';

const FADE = 24;

const styles = StyleSheet.create({
  filling: { flexGrow: 1 },
  sideways: { paddingRight: FADE },
});

/**
 * One choice out of a few, all of them in reach at once.
 *
 * Named after the browser client's own, because a household with a phone and a laptop open should
 * find the same control in the same place under the same name.
 *
 * Every one of them is drawn as the row across the head of the library is: one capsule on liquid
 * glass where the phone has it, with a highlight that springs to the one picked, sat in a row that
 * swipes sideways and fades out at its edges where it holds more than fits — so the choices on
 * every page look and move as the library's do. Where everything fits it keeps no room at its end
 * for a fade, so it sits flush with whatever it is lined up against.
 *
 * @param label - What is being chosen, for anyone who cannot see the row.
 * @param items - What there is to choose from.
 * @param value - Which one is picked, or none yet.
 * @param onSelect - Told which one they picked, the one already picked too, so a choice such as a
 * @param fills - Whether it stretches across the width it is given, its choices spread along it.
 * @param isShown - Whether it is showing, fading in and out when that changes.
 *   filter can be put down again.
 */
const SegmentedRow = ({
  label,
  items,
  value,
  onSelect,
  fills = false,
  isShown = true,
}: SegmentedRowProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [room, setRoom] = useState(0);
  const [wanted, setWanted] = useState(0);
  const isOverflowing = !fills && wanted > room;

  if (items.length === 0) {
    return null;
  }

  return (
    <AFadedEdge leading={isScrolled ? FADE : 0} trailing={isOverflowing ? FADE : 0}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={fills ? styles.filling : isOverflowing ? styles.sideways : null}
        scrollEventThrottle={32}
        onLayout={(event) => {
          setRoom(event.nativeEvent.layout.width);
        }}
        onContentSizeChange={(width) => {
          setWanted(width - (isOverflowing ? FADE : 0));
        }}
        onScroll={(event) => {
          setIsScrolled(event.nativeEvent.contentOffset.x > 1);
        }}
      >
        <ACapsuleRow
          label={label}
          items={items}
          value={value}
          onSelect={onSelect}
          fills={fills}
          isShown={isShown}
        />
      </ScrollView>
    </AFadedEdge>
  );
};

SegmentedRow.displayName = 'SegmentedRow';

export { SegmentedRow };
