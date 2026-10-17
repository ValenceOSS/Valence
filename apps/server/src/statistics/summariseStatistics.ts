import type { ModeCounts, Statistics, StatisticsRange } from '@ValenceContracts/schemas/Statistics';
import { ReasonCodeSchema } from '@ValenceContracts/schemas/PlaybackPlan';
import { localTime } from './localTime';
import { RANGE_DAYS } from './RANGE_DAYS';
import type { PlayRow, ViewingRow } from './StatisticsInputs';

type SummariseStatisticsOptions = {
  range: StatisticsRange;
  zone: string;
  now: Date;
  viewings: readonly ViewingRow[];
  plays: readonly PlayRow[];
  added: readonly Date[];
};

const TOP = 10;

const BUSY_NAMED = 4;

const BUSY_TITLES = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

const noModes = (): ModeCounts => ({ DirectPlay: 0, Remux: 0, DirectStream: 0, Transcode: 0 });

/**
 * Rounds hours to one decimal place, which is as fine as anybody reads them.
 *
 * @param seconds - The time, in seconds.
 * @returns The hours.
 */
const hoursOf = (seconds: number): number => Math.round((seconds / 3600) * 10) / 10;

/**
 * Turns what was watched, how it was delivered and what arrived over a range into what the admin
 * area draws: plays and hours a day, the busy hours of the week, the most watched titles and the
 * people watching most, how plays were delivered and why the server had to convert them, and how
 * many titles arrived each week. Days and hours are the viewer's own, in their time zone.
 *
 * @param range - How far back to look.
 * @param zone - The viewer's time zone.
 * @param now - The end of the range.
 * @param viewings - What was watched, already narrowed to the range.
 * @param plays - How each play was delivered, already narrowed to the range.
 * @param added - When each title arrived, already narrowed to the range.
 * @returns The statistics.
 */
const summariseStatistics = ({
  range,
  zone,
  now,
  viewings,
  plays,
  added,
}: SummariseStatisticsOptions): Statistics => {
  const local = localTime(zone);
  const from = new Date(now.getTime() - RANGE_DAYS[range] * DAY_MS);
  const days = new Map<string, { plays: number; seconds: number }>();

  for (let at = from.getTime() + DAY_MS; at <= now.getTime() + 1; at += DAY_MS) {
    days.set(local(new Date(at)).day, { plays: 0, seconds: 0 });
  }

  const busyHours = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const busyCells = new Map<string, { viewers: Set<string>; titles: Map<string, number> }>();
  const titles = new Map<
    string,
    { mediaItemId: string; seriesId: string | null; title: string; plays: number; seconds: number }
  >();
  const viewers = new Map<string, { name: string; plays: number; seconds: number }>();
  let seconds = 0;

  for (const viewing of viewings) {
    const when = local(viewing.startedAt);
    const day = days.get(when.day) ?? { plays: 0, seconds: 0 };

    days.set(when.day, { plays: day.plays + 1, seconds: day.seconds + viewing.secondsWatched });

    const row = busyHours[when.weekday];

    if (row !== undefined) {
      row[when.hour] = (row[when.hour] ?? 0) + 1;
    }

    const cellKey = `${when.weekday.toString()}:${when.hour.toString()}`;
    const cell = busyCells.get(cellKey) ?? {
      viewers: new Set<string>(),
      titles: new Map<string, number>(),
    };
    const watched = viewing.seriesTitle ?? viewing.title;

    if (viewing.profileName !== null && viewing.profileName !== '') {
      cell.viewers.add(viewing.profileName);
    }

    cell.titles.set(watched, (cell.titles.get(watched) ?? 0) + 1);
    busyCells.set(cellKey, cell);

    seconds += viewing.secondsWatched;

    const titleKey = viewing.seriesId ?? viewing.mediaItemId;
    const title = titles.get(titleKey) ?? {
      mediaItemId: viewing.mediaItemId,
      seriesId: viewing.seriesId,
      title: viewing.seriesTitle ?? viewing.title,
      plays: 0,
      seconds: 0,
    };

    titles.set(titleKey, {
      ...title,
      plays: title.plays + 1,
      seconds: title.seconds + viewing.secondsWatched,
    });

    const viewer = viewers.get(viewing.profileId) ?? {
      name: viewing.profileName ?? '',
      plays: 0,
      seconds: 0,
    };

    viewers.set(viewing.profileId, {
      ...viewer,
      plays: viewer.plays + 1,
      seconds: viewer.seconds + viewing.secondsWatched,
    });
  }

  const modes = noModes();
  const reasons = new Map<string, number>();
  const clients = new Map<string, { modes: ModeCounts; plays: number }>();

  for (const play of plays) {
    modes[play.mode] += 1;

    for (const reason of new Set(play.reasons)) {
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    }

    const client = clients.get(play.client ?? '') ?? { modes: noModes(), plays: 0 };

    client.modes[play.mode] += 1;
    clients.set(play.client ?? '', { modes: client.modes, plays: client.plays + 1 });
  }

  const weeks = new Map<string, number>();
  const mondayOf = (at: Date) => local(new Date(at.getTime() - local(at).weekday * DAY_MS)).day;

  for (let at = from.getTime() + DAY_MS; at <= now.getTime() + 1; at += 7 * DAY_MS) {
    weeks.set(mondayOf(new Date(at)), 0);
  }

  weeks.set(mondayOf(now), weeks.get(mondayOf(now)) ?? 0);

  for (const arrived of added) {
    const monday = mondayOf(arrived);

    weeks.set(monday, (weeks.get(monday) ?? 0) + 1);
  }

  return {
    range,
    from: from.toISOString(),
    to: now.toISOString(),
    totals: {
      plays: viewings.length,
      hours: hoursOf(seconds),
      viewers: viewers.size,
      titles: titles.size,
    },
    days: [...days.entries()]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([day, tally]) => ({ day, plays: tally.plays, hours: hoursOf(tally.seconds) })),
    busyHours,
    busyDetail: [...busyCells.entries()].map(([cellKey, cell]) => {
      const [weekday = 0, hour = 0] = cellKey.split(':').map(Number);

      return {
        weekday,
        hour,
        viewers: [...cell.viewers].slice(0, BUSY_NAMED),
        titles: [...cell.titles.entries()]
          .toSorted(([, a], [, b]) => b - a)
          .slice(0, BUSY_TITLES)
          .map(([title]) => title),
      };
    }),
    topTitles: [...titles.values()]
      .toSorted((a, b) => b.plays - a.plays || b.seconds - a.seconds)
      .slice(0, TOP)
      .map((title) => ({
        mediaItemId: title.mediaItemId,
        seriesId: title.seriesId,
        title: title.title,
        plays: title.plays,
        hours: hoursOf(title.seconds),
      })),
    topViewers: [...viewers.entries()]
      .toSorted(([, a], [, b]) => b.plays - a.plays || b.seconds - a.seconds)
      .slice(0, TOP)
      .map(([profileId, viewer]) => ({
        profileId,
        name: viewer.name,
        plays: viewer.plays,
        hours: hoursOf(viewer.seconds),
      })),
    modes,
    reasons: [...reasons.entries()]
      .flatMap(([code, count]) => {
        const known = ReasonCodeSchema.safeParse(code);

        return known.success && known.data !== 'ClientSupportsSource'
          ? [{ code: known.data, plays: count }]
          : [];
      })
      .toSorted((a, b) => b.plays - a.plays),
    clients: [...clients.entries()]
      .map(([client, tally]) => ({ client, modes: tally.modes, plays: tally.plays }))
      .toSorted((a, b) => b.plays - a.plays),
    added: [...weeks.entries()]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([week, items]) => ({ week, items })),
  };
};

export type { SummariseStatisticsOptions };

export { summariseStatistics };
