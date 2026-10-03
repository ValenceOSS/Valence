import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
} from '@keyline-icons/react-native';
import { addDays } from '@ValenceCore/functions/addDays';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { monthGridOf } from '@ValenceCore/functions/monthGridOf';
import { groupCalendarByDay } from '@ValenceClient/calendar/groupCalendarByDay';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { findAShow } from '@ValenceClient/library/findAShow';
import { calendarQueries } from '@ValenceClient/query/calendarQueries';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { pageInTheLibrary } from '@ValenceMobile/components/SignedIn/pageInTheLibrary';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import { ACalendarSubscribeSheet } from '@ValenceMobile/components/ACalendarSubscribeSheet/ACalendarSubscribeSheet';
import { ACalendarDaySheet } from '@ValenceMobile/components/TheCalendar/components/ACalendarDaySheet/ACalendarDaySheet';
import { ACalendarEntry } from '@ValenceMobile/components/TheCalendar/components/ACalendarEntry/ACalendarEntry';
import { ACalendarMonth } from '@ValenceMobile/components/TheCalendar/components/ACalendarMonth/ACalendarMonth';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { TheCalendarProps } from './TheCalendar.types';

const UPCOMING_DAYS = 60;

const styles = StyleSheet.create({
  month: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  turns: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  quiet: { paddingHorizontal: 16, paddingVertical: 22 },
});

/**
 * The release calendar on a phone: a month of dates dotted for what comes out on them over the
 * day picked, or a list of what is coming over the next two months, each opening its page. Pressing
 * the month's name opens a sheet to turn it to any day, and the circle by the title adds the
 * calendar to a calendar app.
 *
 * @param onOpen - Told to open the page an entry is about.
 * @param onBack - Told somebody is done with it.
 */
const TheCalendar = ({ onOpen, onBack }: TheCalendarProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const today = localDayOf();
  const [view, setView] = useState<'month' | 'upcoming'>('month');
  const [day, setDay] = useState(today);
  const [isPicking, setIsPicking] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const grid = monthGridOf(day);
  const from = view === 'month' ? grid[0] : today;
  const to = view === 'month' ? grid[grid.length - 1] : addDays(today, UPCOMING_DAYS - 1);
  const asked = useQuery(calendarQueries.releases(from ?? today, to ?? today, 'mine'));
  const entries = asked.data ?? [];
  const onTheDay = entries.filter((entry) => entry.date === day);
  const first = `${day.slice(0, 7)}-01`;

  const open = (entry: CalendarEntry) => {
    const { opens } = entry;

    switch (opens.kind) {
      case 'item':
        onOpen({ kind: 'title', mediaId: opens.mediaId });
        break;
      case 'asking':
        if (whatAPhoneAsksFor(opens.requestKind)) {
          onOpen({ kind: 'asking', about: opens.requestKind, id: opens.catalogueId });
        }
        break;
      case 'show':
        void findAShow(cache, opens.showId)
          .catch(() => null)
          .then((show) => {
            onOpen(
              show === null
                ? pageInTheLibrary('series', opens.showId)
                : { kind: 'show', libraryId: show.libraryId, showId: show.id },
            );
          });
        break;
    }
  };

  return (
    <Screen scrolls onBack={onBack}>
      <View style={styles.month}>
        <Words size="title">{say('common.calendar')}</Words>
        <AGlassCircle
          of={CalendarPlus}
          label={say('common.addToCalendar')}
          onPress={() => {
            setIsSubscribing(true);
          }}
        />
      </View>

      <SegmentedRow
        label={say('common.calendarViews')}
        items={[
          { id: 'month', label: say('common.month') },
          { id: 'upcoming', label: say('common.upcoming') },
        ]}
        value={view}
        onSelect={(id) => {
          setView(id === 'upcoming' ? 'upcoming' : 'month');
        }}
      />

      {view === 'month' ? (
        <>
          <View style={styles.month}>
            <Button
              tone="bare"
              label={say('common.goToADay')}
              onPress={() => {
                setIsPicking(true);
              }}
            >
              <View style={styles.title}>
                <Words size="heading">{nameTheMonth(day)}</Words>
                <Icon of={CalendarIcon} size={18} colour={colours.textMuted} />
              </View>
            </Button>
            <View style={styles.turns}>
              {day === today ? null : (
                <Button
                  tone="quiet"
                  onPress={() => {
                    setDay(today);
                  }}
                >
                  {say('common.today')}
                </Button>
              )}
              <AGlassCircle
                of={ChevronLeft}
                label={say('common.previous')}
                onPress={() => {
                  setDay(`${addDays(first, -1).slice(0, 7)}-01`);
                }}
              />
              <AGlassCircle
                of={ChevronRight}
                label={say('common.next')}
                onPress={() => {
                  setDay(`${addDays(first, 31).slice(0, 7)}-01`);
                }}
              />
            </View>
          </View>

          <ARising key={day.slice(0, 7)}>
            <AGroup>
              <ACalendarMonth day={day} today={today} entries={entries} onPick={setDay} />
            </AGroup>
          </ARising>

          <ARising key={day} after={80}>
            <AGroup title={nameTheDay(day, today)}>
              {asked.isPending ? (
                <View style={styles.quiet}>
                  <ActivityIndicator color={colours.textMuted} />
                </View>
              ) : onTheDay.length === 0 ? (
                <View style={styles.quiet}>
                  <Words size="small" tone="muted" isCentred>
                    {say('common.noReleases')}
                  </Words>
                </View>
              ) : (
                onTheDay.map((entry) => (
                  <ACalendarEntry key={`${entry.id}:${entry.date}`} entry={entry} onOpen={open} />
                ))
              )}
            </AGroup>
          </ARising>
        </>
      ) : asked.isPending ? (
        <ActivityIndicator color={colours.textMuted} />
      ) : entries.length === 0 ? (
        <ANothingHere
          of={CalendarIcon}
          title={say('common.nothingComesOutOnTheseDays')}
          detail={say('common.episodesAndRequestsAppearHere')}
        />
      ) : (
        groupCalendarByDay(entries).map((group, turn) => (
          <ARising key={group.date} turn={Math.min(turn, 8)}>
            <AGroup title={nameTheDay(group.date, today)}>
              {group.entries.map((entry) => (
                <ACalendarEntry key={`${entry.id}:${entry.date}`} entry={entry} onOpen={open} />
              ))}
            </AGroup>
          </ARising>
        ))
      )}

      {asked.isError ? <Words tone="danger">{say('common.thoseCouldNotBeRead')}</Words> : null}

      <ACalendarSubscribeSheet
        isOpen={isSubscribing}
        onClose={() => {
          setIsSubscribing(false);
        }}
      />

      <ACalendarDaySheet
        isOpen={isPicking}
        day={day}
        today={today}
        onPick={setDay}
        onClose={() => {
          setIsPicking(false);
        }}
      />
    </Screen>
  );
};

TheCalendar.displayName = 'TheCalendar';

export { TheCalendar };
