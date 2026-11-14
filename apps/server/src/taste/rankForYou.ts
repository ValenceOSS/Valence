import { dotOf } from './dotOf';
import type { TasteVector } from './TasteVector';
import { unitOf } from './unitOf';

type RankForYouOptions = {
  vectors: ReadonlyMap<string, TasteVector>;
  weights: ReadonlyMap<string, number>;
  watchers: ReadonlyMap<string, ReadonlySet<string>>;
  profileId: string;
  recommended: ReadonlyMap<string, number>;
  ratings: ReadonlyMap<string, number | null>;
  leaveOut: ReadonlySet<string>;
  limit: number;
};

const ALIKE_SHARE = 0.65;

const WATCHED_TOGETHER_SHARE = 0.35;

const RECOMMENDED_BONUS = 0.15;

const RATING_SHARE = 0.05;

const RELEVANCE_OVER_VARIETY = 0.8;

const LOOKED_AT_FOR_EACH = 5;

/**
 * Ranks the titles somebody has not started by how likely they are to enjoy each, learning their
 * taste from what they watched: a vector of the features of everything they watched, each title
 * pulling it by how much it said, scored against each candidate's features; how often the others on
 * the server who watched what they liked watched the candidate too; a lift where the catalogue
 * recommends it beside something they liked; and a little for how well rated it is. With nothing
 * watched yet, what most of the household watched leads instead. The best are then taken one by one,
 * each weighed against how like the ones already taken it is, so the row is not one title many
 * times over.
 *
 * @param options - The titles' features, what the viewer watched and how much each said, who watched
 *   what, the catalogue's recommendations, the titles' ratings, what to leave out and how many to
 *   take.
 * @returns The titles' ids, best first.
 */
const rankForYou = ({
  vectors,
  weights,
  watchers,
  profileId,
  recommended,
  ratings,
  leaveOut,
  limit,
}: RankForYouOptions): string[] => {
  const pulled = new Map<string, number>();

  for (const [id, weight] of weights) {
    for (const [feature, value] of vectors.get(id) ?? new Map<string, number>()) {
      pulled.set(feature, (pulled.get(feature) ?? 0) + weight * value);
    }
  }

  const taste = unitOf(pulled);
  const liked = [...weights].filter(([, weight]) => weight > 0);
  const likedWeight = liked.reduce((sum, [, weight]) => sum + weight, 0);
  const othersOf = (id: string): ReadonlySet<string> =>
    new Set([...(watchers.get(id) ?? [])].filter((one) => one !== profileId));
  const likedOthers = liked.map(([id, weight]) => ({ others: othersOf(id), weight }));
  const mostWatchers = Math.max(1, ...[...watchers.keys()].map((id) => othersOf(id).size));

  /**
   * How far those who watched what the viewer liked watched this title too.
   *
   * @param id - The title.
   * @returns From nought to one.
   */
  const watchedTogether = (id: string): number => {
    const others = othersOf(id);

    if (others.size === 0 || likedWeight === 0) {
      return 0;
    }

    let sum = 0;

    for (const one of likedOthers) {
      if (one.others.size === 0) {
        continue;
      }

      let shared = 0;

      for (const person of others) {
        if (one.others.has(person)) {
          shared += 1;
        }
      }

      sum += (one.weight * shared) / Math.sqrt(others.size * one.others.size);
    }

    return sum / likedWeight;
  };

  const scored = [...vectors.keys()]
    .filter((id) => !leaveOut.has(id) && !weights.has(id))
    .map((id) => {
      const rating = (ratings.get(id) ?? 0) / 10;

      if (taste.size === 0) {
        return { id, score: othersOf(id).size / mostWatchers + RATING_SHARE * rating };
      }

      const relevance =
        ALIKE_SHARE * dotOf(taste, vectors.get(id) ?? new Map<string, number>()) +
        WATCHED_TOGETHER_SHARE * watchedTogether(id) +
        RECOMMENDED_BONUS * (recommended.get(id) ?? 0);

      return { id, score: relevance > 0 ? relevance + RATING_SHARE * rating : 0 };
    })
    .filter((one) => one.score > 0)
    .toSorted((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit * LOOKED_AT_FOR_EACH);

  const taken: string[] = [];
  const waiting = [...scored];

  while (taken.length < limit && waiting.length > 0) {
    let best = 0;
    let bestValue = Number.NEGATIVE_INFINITY;

    for (const [at, one] of waiting.entries()) {
      const vector = vectors.get(one.id) ?? new Map<string, number>();
      const closest = Math.max(
        0,
        ...taken.map((id) => dotOf(vector, vectors.get(id) ?? new Map<string, number>())),
      );
      const value = RELEVANCE_OVER_VARIETY * one.score - (1 - RELEVANCE_OVER_VARIETY) * closest;

      if (value > bestValue) {
        best = at;
        bestValue = value;
      }
    }

    const [chosen] = waiting.splice(best, 1);

    if (chosen !== undefined) {
      taken.push(chosen.id);
    }
  }

  return taken;
};

export type { RankForYouOptions };

export { rankForYou };
