import { say } from '@ValenceI18n/say';
import { sayingAll } from '@ValenceI18n/sayingAll';

const SHORTEST_RANGE = 3;

/**
 * The seasons in a list as a person would read them out: runs of three or more as a range, so one
 * to nine is "1–9" and one to seven without five is "1–4, 6 and 7".
 *
 * @param seasons - The regular seasons, in order, each once.
 * @returns Each run or season as it is written.
 */
const runsOf = (seasons: readonly number[]): string[] => {
  const runs: number[][] = [];

  for (const season of seasons) {
    const last = runs.at(-1);

    if (last !== undefined && last.at(-1) === season - 1) {
      last.push(season);
    } else {
      runs.push([season]);
    }
  }

  return runs.flatMap((run) =>
    run.length >= SHORTEST_RANGE
      ? [`${String(run[0])}–${String(run.at(-1))}`]
      : run.map((season) => season.toString()),
  );
};

/**
 * Which seasons of a series were asked for, the way a person would say it: "Season 3", "Seasons 1
 * and 3", "Seasons 1–4, 6 and 7", and the specials — season zero — by name rather than as a zero.
 *
 * @param seasons - The season numbers asked for.
 * @returns How to say them, or nothing where none were named.
 */
const describeSeasons = (seasons: readonly number[]): string | null => {
  const hasSpecials = seasons.includes(0);
  const regular = [...new Set(seasons.filter((season) => season > 0))].toSorted(
    (one, other) => one - other,
  );
  const [first, ...rest] = runsOf(regular);

  if (first === undefined) {
    return hasSpecials ? say('common.specials') : null;
  }

  if (rest.length === 0 && regular.length === 1) {
    return hasSpecials
      ? say('server.webhooks.notice.specialsAndSeason', { season: first })
      : say('screens.mediaPanel.gatherTitles.seasonSeason', { season: first });
  }

  const listed = sayingAll([first, ...rest]).message;

  return hasSpecials
    ? say('server.webhooks.notice.specialsAndSeasons', { seasons: listed })
    : say('server.webhooks.notice.seasons', { seasons: listed });
};

export { describeSeasons };
