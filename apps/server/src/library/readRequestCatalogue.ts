import { z } from 'zod';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

const RequestDetailSchema = z.object({
  title: z.string().optional(),
  name: z.string().optional(),
  original_title: z.string().optional(),
  original_name: z.string().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  overview: z.string().optional(),
  poster_path: z.string().nullish(),
  runtime: z.number().int().nullish(),
  episode_run_time: z.array(z.number().int()).default([]),
  status: z.string().optional(),
  release_dates: z
    .object({
      results: z
        .array(
          z.object({
            release_dates: z
              .array(z.object({ type: z.number().int(), release_date: z.string() }))
              .default([]),
          }),
        )
        .default([]),
    })
    .optional(),
  alternative_titles: z
    .object({
      titles: z.array(z.object({ title: z.string() })).default([]),
      results: z.array(z.object({ title: z.string() })).default([]),
    })
    .optional(),
});

const RequestSeasonSchema = z.object({
  season_number: z.number().int().nonnegative().optional(),
  episodes: z
    .array(
      z.object({
        season_number: z.number().int().nonnegative().optional(),
        episode_number: z.number().int().nonnegative(),
        name: z.string().optional(),
        air_date: z.string().nullish(),
      }),
    )
    .default([]),
});

const THEATRICAL = [2, 3];

const DIGITAL = 4;

const PHYSICAL = 5;

// eslint-disable-next-line valence/no-hard-coded-strings -- status values the catalogue sends
const ENDED = new Set(['Ended', 'Canceled']);

const MOST_ALIASES = 20;

/**
 * The calendar date at the start of a catalogue date, or null where it gave none worth reading.
 *
 * @param date - The date as the catalogue gave it.
 * @returns The calendar date.
 */
const calendarDateOf = (date: string | null | undefined): string | null =>
  date !== null && date !== undefined && /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : null;

/**
 * Reads what a catalogue says about a film or series into what a request needs of it: its title
 * and the others it goes by in the Latin alphabet, which is what release names are written in; its
 * year; how long it runs; for a film the first day it was out in cinemas, digitally and on disc
 * anywhere; and for a series each episode and the day it aired, and whether it has ended.
 *
 * @param detail - The catalogue's record of the film or series.
 * @param seasons - For a series, the catalogue's record of each season.
 * @param posterUrlOf - Where the catalogue serves a poster from.
 * @returns What a request needs, or null where the record was not one.
 */
const readRequestCatalogue = (
  detail: JsonValue | null,
  seasons: readonly (JsonValue | null)[],
  posterUrlOf: (path: string | null | undefined) => string | null,
): RequestCatalogue | null => {
  const read = RequestDetailSchema.safeParse(detail);

  if (!read.success) {
    return null;
  }

  const found = read.data;
  const title = found.title ?? found.name;

  if (title === undefined || title === '') {
    return null;
  }

  const earliest = (types: readonly number[]) =>
    (found.release_dates?.results ?? [])
      .flatMap((country) => country.release_dates)
      .filter((release) => types.includes(release.type))
      .map((release) => calendarDateOf(release.release_date))
      .filter((date) => date !== null)
      .toSorted()[0] ?? null;
  const aliases = [
    found.original_title ?? found.original_name,
    ...(found.alternative_titles?.titles ?? []).map((alternative) => alternative.title),
    ...(found.alternative_titles?.results ?? []).map((alternative) => alternative.title),
  ].filter(
    (alias): alias is string =>
      alias !== undefined && alias !== title && /\p{Script=Latin}/u.test(alias),
  );
  const firstAired = calendarDateOf(found.release_date ?? found.first_air_date);

  return {
    title,
    year: firstAired === null ? null : Number(firstAired.slice(0, 4)),
    aliases: [...new Set(aliases)].slice(0, MOST_ALIASES),
    overview: found.overview === undefined || found.overview === '' ? null : found.overview,
    posterUrl: posterUrlOf(found.poster_path),
    runtimeMinutes:
      (found.runtime ?? found.episode_run_time[0] ?? 0) > 0
        ? (found.runtime ?? found.episode_run_time[0] ?? null)
        : null,
    releaseDates: {
      theatrical: earliest(THEATRICAL),
      digital: earliest([DIGITAL]),
      physical: earliest([PHYSICAL]),
    },
    episodes: seasons.flatMap((season) => {
      const listed = RequestSeasonSchema.safeParse(season);

      return listed.success
        ? listed.data.episodes.map((episode) => ({
            season: episode.season_number ?? listed.data.season_number ?? 0,
            episode: episode.episode_number,
            title: episode.name ?? '',
            airDate: calendarDateOf(episode.air_date),
          }))
        : [];
    }),
    isEnded: found.status !== undefined && ENDED.has(found.status),
    artist: null,
    albums: [],
  };
};

export { readRequestCatalogue };
