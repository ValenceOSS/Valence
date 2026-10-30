import { StyleSheet, Text } from 'react-native';
import { backdropOfCalendarEntry } from '@ValenceClient/calendar/backdropOfCalendarEntry';
import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { useMe } from '@ValenceClient/requests/useMe';
import { Spotlight } from '@ValenceTv/components/Spotlight/Spotlight';
import { TitleLockup } from '@ValenceTv/components/TitleLockup/TitleLockup';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CalendarHeroProps } from './CalendarHero.types';
import { say } from '@ValenceI18n/say';

/**
 * The top of the release calendar: whatever the remote rests on, written large — its lettering,
 * which episode or which release it is, and the day it comes out with where it has got to — over
 * its picture.
 *
 * @param entry - What the remote rests on, or nothing before anything is there.
 * @param today - Today, to name the day it comes out against.
 * @param children - What is said in its place where there is nothing to show, under the page's
 *   name.
 */
const CalendarHero = ({ entry, today, children }: CalendarHeroProps) => {
  const me = useMe();

  return (
    <Spotlight picture={entry === null ? null : backdropOfCalendarEntry(entry)}>
      {entry === null ? (
        <>
          <Text style={styles.heading}>{say('common.calendar')}</Text>
          {children}
        </>
      ) : (
        <>
          <TitleLockup
            key={entry.id}
            mediaId={entry.artworkMediaId}
            name={entry.title}
            hasLogo={entry.artworkMediaId !== null}
            logoPath={entry.logoUrl}
            isSeated
          />
          <Text numberOfLines={1} style={styles.what}>
            {describeCalendarEntry(entry)}
          </Text>
          <Text numberOfLines={1} style={styles.where}>
            {joinFacts([
              nameTheDay(entry.date, today),
              describeCalendarState(entry.state).label,
              entry.requestedBy === null ? undefined : nameOfAskerFor(entry.requestedBy, me),
            ])}
          </Text>
        </>
      )}
    </Spotlight>
  );
};

CalendarHero.displayName = 'CalendarHero';

const styles = StyleSheet.create({
  heading: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  what: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
  where: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { CalendarHero };
