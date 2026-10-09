import { say } from '@ValenceI18n/say';
import type { CalendarEntry, CalendarState } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { ICalEvent } from '@ValenceServer/calendar/ICalEvent';

const STATE_HANDLERS = {
  available: 'common.inTheLibrary',
  downloading: 'common.downloading',
  wanted: 'client.requests.titleStatusNames.missing',
  notOutYet: 'common.notOutYet',
  notHeld: 'common.notInTheLibrary',
} as const satisfies Record<CalendarState, string>;

/**
 * What an entry is called in a calendar app: an episode by its show, which episode it is and its
 * own name, and a film by its title and which of its releases this is.
 *
 * @param entry - What comes out.
 * @returns Its title.
 */
const summaryOf = (entry: CalendarEntry): string => {
  if (entry.episode !== null) {
    return say('server.calendar.calendarEvents.showSeasonEpisodeTitle', {
      show: entry.title,
      seasonNumber: entry.episode.seasonNumber.toString(),
      episodeNumber: entry.episode.episodeNumber.toString(),
      episode: entry.episode.title,
    });
  }

  switch (entry.release) {
    case 'cinema':
      return say('server.calendar.calendarEvents.titleInCinemas', { title: entry.title });
    case 'digital':
      return say('server.calendar.calendarEvents.titleToBuyOrRent', { title: entry.title });
    case 'physical':
      return say('server.calendar.calendarEvents.titleOnDisc', { title: entry.title });
    case 'airs':
      return entry.title;
  }
};

/**
 * Turns the release calendar into the events of a calendar app's feed: each titled as the app
 * would say it, described by where it has got to and who asked for it, and linking back to its day
 * on this server's calendar.
 *
 * @param entries - What comes out.
 * @param origin - Where this server is reached, for the links back.
 * @returns The events.
 */
const calendarEvents = (entries: readonly CalendarEntry[], origin: string): ICalEvent[] =>
  entries.map((entry) => ({
    uid: `${entry.id}@valence`,
    date: entry.date,
    summary: summaryOf(entry),
    description: [
      say(STATE_HANDLERS[entry.state]),
      entry.requestedBy === null
        ? null
        : say('common.askedByName', { name: entry.requestedBy.name }),
    ]
      .filter((line) => line !== null)
      .join('\n'),
    url: `${origin}/calendar?on=${entry.date}`,
  }));

export { calendarEvents };
