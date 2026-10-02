import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { addDays } from '@ValenceCore/functions/addDays';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { groupCalendarByDay } from '@ValenceClient/calendar/groupCalendarByDay';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { calendarQueries } from '@ValenceClient/query/calendarQueries';
import { tokens } from '@ValenceTv/theme/tokens';
import { CalendarRow } from './components/CalendarRow/CalendarRow';
import type { CalendarPageProps } from './CalendarPage.types';
import { say } from '@ValenceI18n/say';

const UPCOMING_DAYS = 60;

/**
 * The release calendar on a television: what comes out over the next two months, a heading for
 * each day with anything on it, each opening its page when chosen. The page is lit by the first
 * thing coming.
 *
 * @param onOpen - Told which entry was chosen.
 * @param onLight - Told which picture lights the page.
 */
const CalendarPage = ({ onOpen, onLight }: CalendarPageProps) => {
  const today = localDayOf();
  const asked = useQuery(
    calendarQueries.releases(today, addDays(today, UPCOMING_DAYS - 1), 'mine'),
  );
  const days = groupCalendarByDay(asked.data ?? []);
  const first = days[0]?.entries[0] ?? null;
  const lead =
    first === null
      ? null
      : first.artworkMediaId === null
        ? first.posterUrl
        : artworkUrl(first.artworkMediaId, 'backdrop');

  useEffect(() => {
    onLight(lead);
  }, [lead, onLight]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.inside}>
      <Text style={styles.heading}>{say('common.calendar')}</Text>

      {asked.isPending ? (
        <ActivityIndicator size="large" color={tokens.colours.text} />
      ) : asked.isError ? (
        <Text style={styles.nothing}>{say('common.thoseCouldNotBeRead')}</Text>
      ) : days.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.nothing}>{say('common.nothingComesOutOnTheseDays')}</Text>
          <Text style={styles.hint}>{say('common.episodesAndRequestsAppearHere')}</Text>
        </View>
      ) : (
        days.map((day, at) => (
          <View key={day.date} style={styles.day}>
            <Text style={styles.date}>{nameTheDay(day.date, today)}</Text>
            {day.entries.map((entry, index) => (
              <CalendarRow
                key={`${entry.id}:${entry.date}`}
                entry={entry}
                hasPreferredFocus={at === 0 && index === 0}
                onPress={onOpen}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

CalendarPage.displayName = 'CalendarPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingTop: tokens.space.xl + tokens.space.lg,
    paddingBottom: tokens.space.xl,
    gap: tokens.space.lg,
  },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.title,
    fontWeight: '700',
  },
  day: { gap: tokens.space.xs },
  date: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: tokens.space.xs,
  },
  empty: { gap: tokens.space.xs },
  nothing: { color: tokens.colours.text, fontSize: tokens.type.body },
  hint: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { CalendarPage };
