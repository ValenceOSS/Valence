import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { findGaps } from '@ValenceCore/functions/findGaps';
import { inSeasonOrder } from '@ValenceCore/functions/inSeasonOrder';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';

type ASeasonRow = {
  key: string;
  at: number;
  episode: MediaSummary | null;
  listed: { title: string; stillUrl?: string | null | undefined } | null;
  airs: string;
};

type SeasonsLaidOut = {
  choices: { seasonNumber: number | null; isHeld: boolean }[];
  showing: number | null;
  rows: ASeasonRow[];
};

/**
 * Lays a programme's seasons out as its page shows them: every season it has and every season the
 * catalogue says it is missing, in order, and for the one showing, its episodes and the ones it is
 * missing between them, each with when it airs where the catalogue knows.
 *
 * @param detail - The programme, with the catalogue's shape of it where one was fetched.
 * @param chosenSeason - The season somebody chose, or null for the first.
 * @param today - Today, as `2026-09-28`, for saying when an episode airs.
 * @returns The seasons to choose from, which is showing, and its rows.
 */
const laySeasonsOut = (
  detail: ShowDetail,
  chosenSeason: number | null,
  today: string,
): SeasonsLaidOut => {
  const gaps = findGaps(detail);
  const choices = [
    ...detail.seasons.map((one) => ({ seasonNumber: one.seasonNumber, isHeld: true })),
    ...gaps.seasons.map((number) => ({ seasonNumber: number, isHeld: false })),
  ].sort((left, right) => inSeasonOrder(left.seasonNumber, right.seasonNumber));
  const chosen = choices.find((one) => one.seasonNumber === chosenSeason) ?? choices[0];
  const showing = chosen?.seasonNumber ?? null;
  const season = detail.seasons.find((one) => one.seasonNumber === showing) ?? { episodes: [] };
  const listedHere = (detail.shape ?? []).find((one) => one.seasonNumber === (showing ?? -1));
  const missingHere =
    chosen?.isHeld === false
      ? (listedHere?.episodes.map((one) => one.episodeNumber) ?? [])
      : (gaps.episodes.get(showing ?? -1) ?? []);

  const airsOf = (episodeNumber: number): string => {
    const airDate = listedHere?.episodes.find(
      (one) => one.episodeNumber === episodeNumber,
    )?.airDate;

    return airDate === undefined || airDate === null ? '' : describeAirDate(airDate, today);
  };

  const rows = [
    ...season.episodes.map((episode) => ({
      key: episode.id,
      at: episode.episodeNumber ?? 0,
      episode,
      listed: null,
      airs: airsOf(episode.episodeNumber ?? 0),
    })),
    ...missingHere.map((number) => ({
      key: `missing-${number.toString()}`,
      at: number,
      episode: null,
      listed: listedHere?.episodes.find((one) => one.episodeNumber === number) ?? null,
      airs: airsOf(number),
    })),
  ].sort((left, right) => left.at - right.at);

  return { choices, showing, rows };
};

export type { ASeasonRow, SeasonsLaidOut };

export { laySeasonsOut };
