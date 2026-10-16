import type { AnimeNumbering, AnimeQuestion } from '@ValenceContracts/schemas/Anime';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Reading } from '@ValenceRequests/mediaRequests/matchAnimeRelease';

const MOST_ASKED = 20;

/**
 * The questions an anime request keeps open with one more, about a release whose numbers could
 * mean more than one set of episodes: each way it could be read, the best guess, and the release
 * itself so it can be fetched once answered. A release already asked about is asked about once,
 * and only the latest few are kept.
 *
 * @param asked - The questions kept.
 * @param release - The release.
 * @param unsettled - How it could be read, and the best guess.
 * @param group - The release group that put it out, where its name says.
 * @param id - The new question's id.
 * @param at - The moment it is asked.
 * @returns The questions to keep.
 */
const askWhichEpisode = (
  asked: readonly AnimeQuestion[] | null | undefined,
  release: Release,
  unsettled: { readings: Reading[]; guess: AnimeNumbering },
  group: string | null,
  id: string,
  at: string,
): AnimeQuestion[] => {
  const kept = (asked ?? []).filter((question) => question.release.title !== release.title);

  return [
    ...kept,
    {
      id,
      release,
      group,
      readings: unsettled.readings.slice(0, 4),
      guess: unsettled.guess,
      at,
    },
  ].slice(-MOST_ASKED);
};

export { askWhichEpisode };
