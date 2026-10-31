import { FlatList, StyleSheet, Text, View } from 'react-native';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { CalendarCard } from '@ValenceTv/screens/CalendarPage/components/CalendarCard/CalendarCard';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CalendarDayShelfProps } from './CalendarDayShelf.types';

/**
 * One day on the release calendar, as a shelf of wide cards under its name. It builds only the
 * cards near the remote, so a day with dozens of episodes costs a television's browser no more
 * than a quiet one, and it sends the remote back to the card it was last on.
 *
 * @param day - The day and what comes out on it.
 * @param name - What the day is called: today, tomorrow, or its date.
 * @param isFirst - Whether it is the first day, whose first card the remote starts on.
 * @param onFocus - Told which entry the remote has come to rest on.
 * @param onOpen - Told which entry was chosen.
 */
const CalendarDayShelf = ({ day, name, isFirst, onFocus, onOpen }: CalendarDayShelfProps) => (
  <View style={styles.day}>
    <Text style={styles.name}>{name}</Text>

    <FocusGuide isRemembering>
      <FlatList
        horizontal
        data={day.entries}
        keyExtractor={(entry) => `${entry.id}:${entry.date}`}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={5}
        windowSize={3}
        style={styles.row}
        contentContainerStyle={styles.inside}
        renderItem={({ item, index }) => (
          <CalendarCard
            entry={item}
            hasPreferredFocus={isFirst && index === 0}
            onFocus={onFocus}
            onPress={onOpen}
          />
        )}
      />
    </FocusGuide>
  </View>
);

CalendarDayShelf.displayName = 'CalendarDayShelf';

const styles = StyleSheet.create({
  day: { gap: tokens.space.xs },
  name: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingLeft: tokens.space.edge,
  },
  row: { overflow: 'hidden' },
  inside: {
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.md,
  },
});

export { CalendarDayShelf };
