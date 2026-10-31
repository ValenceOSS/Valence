import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { useMe } from '@ValenceClient/requests/useMe';
import { StyleSheet, Text, View } from 'react-native';
import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { backdropOfCalendarEntry } from '@ValenceClient/calendar/backdropOfCalendarEntry';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CalendarCardProps } from './CalendarCard.types';

const SHADOW_REACH = 12;

const PICTURE = { width: 400, height: 225 };

/**
 * One thing released on the release calendar, as a wide card: a still from the episode, or the
 * title's backdrop, with its name, which episode or which release it is, and where it has got to,
 * with whoever asked for it.
 *
 * @param entry - What is released.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param onFocus - Told the remote has come to rest on it.
 * @param onPress - Told when it is chosen, to open its page.
 */
const CalendarCard = ({ entry, hasPreferredFocus, onFocus, onPress }: CalendarCardProps) => {
  const me = useMe();
  const what = describeCalendarEntry(entry);
  const where = joinFacts([
    describeCalendarState(entry.state).label,
    entry.requestedBy === null ? undefined : nameOfAskerFor(entry.requestedBy, me),
  ]);
  const picture = entry.episode?.stillUrl ?? backdropOfCalendarEntry(entry, 'medium');

  return (
    <Focusable
      label={joinFacts([entry.title, what, where])}
      shadow={{ height: PICTURE.height, cornerRadius: tokens.radii.lg, reach: SHADOW_REACH }}
      scale={1.06}
      hasPreferredFocus={hasPreferredFocus}
      onFocus={() => {
        onFocus(entry);
      }}
      onPress={() => {
        onPress(entry);
      }}
    >
      <View style={{ width: PICTURE.width }}>
        <View style={[styles.picture, PICTURE]}>
          <Artwork path={picture} style={StyleSheet.absoluteFill} />
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {entry.title}
        </Text>
        <Text numberOfLines={1} style={styles.what}>
          {what}
        </Text>
        <Text numberOfLines={1} style={styles.where}>
          {where}
        </Text>
      </View>
    </Focusable>
  );
};

CalendarCard.displayName = 'CalendarCard';

const styles = StyleSheet.create({
  picture: {
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  title: {
    marginTop: tokens.space.sm,
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
  },
  what: { color: tokens.colours.text, fontSize: tokens.type.small - 4 },
  where: { color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
});

export { CalendarCard };
