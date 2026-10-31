import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { addDays } from '@ValenceCore/functions/addDays';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { backdropOfCalendarEntry } from '@ValenceClient/calendar/backdropOfCalendarEntry';
import { groupCalendarByDay } from '@ValenceClient/calendar/groupCalendarByDay';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { calendarQueries } from '@ValenceClient/query/calendarQueries';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';
import { tokens } from '@ValenceTv/theme/tokens';
import { CalendarDayShelf } from './components/CalendarDayShelf/CalendarDayShelf';
import { CalendarHero } from './components/CalendarHero/CalendarHero';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarPageProps } from './CalendarPage.types';
import { say } from '@ValenceI18n/say';

const UPCOMING_DAYS = 60;

const SETTLES_AFTER_MS = 250;

/**
 * The release calendar on a television: what comes out over the next two months, a shelf of wide
 * cards for each day with anything on it, each opening its page when chosen. Whatever the remote
 * rests on is written large across the top and lights the page, starting on the first thing
 * coming, once the remote has settled on it, so running along a shelf does not fetch every picture
 * it passes; the shelves scroll beneath it, fading out under it rather than cut off.
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
  const [restingOn, setRestingOn] = useState<CalendarEntry | null>(null);
  const settled = useSettled(restingOn, SETTLES_AFTER_MS);
  const shown = settled ?? days[0]?.entries[0] ?? null;
  const lead = shown === null ? null : backdropOfCalendarEntry(shown);

  useEffect(() => {
    onLight(lead);
  }, [lead, onLight]);

  return (
    <View style={styles.page}>
      <CalendarHero entry={shown} today={today}>
        {asked.isPending ? (
          <ActivityIndicator size="large" color={tokens.colours.text} style={styles.waiting} />
        ) : asked.isError ? (
          <Text style={styles.nothing}>{say('common.thoseCouldNotBeRead')}</Text>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.nothing}>{say('common.nothingComesOutOnTheseDays')}</Text>
            <Text style={styles.hint}>{say('common.episodesAndRequestsAppearHere')}</Text>
          </View>
        )}
      </CalendarHero>

      {days.length === 0 ? null : (
        <EdgeFade edge="top" reach={0.08} style={styles.days}>
          <ScrollView style={styles.days} contentContainerStyle={styles.inside}>
            {days.map((day, at) => (
              <CalendarDayShelf
                key={day.date}
                day={day}
                name={nameTheDay(day.date, today)}
                isFirst={at === 0}
                onFocus={setRestingOn}
                onOpen={onOpen}
              />
            ))}
          </ScrollView>
        </EdgeFade>
      )}
    </View>
  );
};

CalendarPage.displayName = 'CalendarPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  days: { flex: 1 },
  inside: { gap: tokens.space.sm, paddingTop: tokens.space.sm, paddingBottom: tokens.space.xl },
  waiting: { alignSelf: 'flex-start' },
  empty: { gap: tokens.space.xs },
  nothing: { color: tokens.colours.text, fontSize: tokens.type.body },
  hint: { color: tokens.colours.muted, fontSize: tokens.type.small, maxWidth: 900 },
});

export { CalendarPage };
