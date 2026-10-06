import { StyleSheet, Text, View } from 'react-native';
import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { posterOfCalendarEntry } from '@ValenceClient/calendar/posterOfCalendarEntry';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CalendarRowProps } from './CalendarRow.types';

const POSTER = { width: 80, height: 120 };

/**
 * One thing released on the release calendar: its poster and name, which episode or which release
 * it is, and where it has got to, with whoever asked for it.
 *
 * @param entry - What is released.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param onPress - Told when it is chosen, to open its page.
 */
const CalendarRow = ({ entry, hasPreferredFocus, onPress }: CalendarRowProps) => {
  const what = describeCalendarEntry(entry);
  const where = joinFacts([describeCalendarState(entry.state).label, entry.requestedBy?.name]);

  return (
    <Focusable
      label={joinFacts([entry.title, what, where])}
      scale={1.02}
      isAnchoredLeft
      hasPreferredFocus={hasPreferredFocus}
      onPress={() => {
        onPress(entry);
      }}
    >
      {(isFocused) => {
        const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;

        return (
          <View style={[styles.row, isFocused && styles.focused]}>
            <View style={[styles.poster, POSTER]}>
              <Artwork path={posterOfCalendarEntry(entry)} style={StyleSheet.absoluteFill} />
            </View>

            <View style={styles.words}>
              <Text numberOfLines={1} style={[styles.title, { color: ink }]}>
                {entry.title}
              </Text>
              <Text numberOfLines={1} style={[styles.what, { color: ink }]}>
                {what}
              </Text>
              <Text numberOfLines={1} style={[styles.where, isFocused && { color: ink }]}>
                {where}
              </Text>
            </View>
          </View>
        );
      }}
    </Focusable>
  );
};

CalendarRow.displayName = 'CalendarRow';

const styles = StyleSheet.create({
  row: {
    width: 1100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.sm,
    borderRadius: tokens.radii.lg,
  },
  focused: { backgroundColor: '#ffffff', borderRadius: tokens.radii.lg },
  poster: {
    borderRadius: tokens.radii.sm,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  words: { flex: 1, gap: tokens.space.xs },
  title: { fontSize: tokens.type.body, fontWeight: '600' },
  what: { fontSize: tokens.type.small },
  where: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { CalendarRow };
