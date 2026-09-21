import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { createExpiringCache } from '@ValenceServer/library/createExpiringCache';
import type { MetadataProvider } from '@ValenceServer/library/MetadataProvider';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const SCORE_KEPT_FOR_MS = 24 * 60 * 60 * 1000;

const ANSWER_LIMIT_MS = 8_000;

const OmdbAnswerSchema = z.object({
  Ratings: z.array(z.object({ Source: z.string(), Value: z.string() })).default([]),
});

type Fetcher = (
  url: string,
  init: { signal: AbortSignal },
) => Promise<{ ok: boolean; json: () => Promise<JsonValue> }>;

type WithRottenTomatoesOptions = {
  readApiKey: () => Promise<string>;
  fetchImpl?: Fetcher;
  baseUrl?: string;
  onProblem?: (reason: string) => void;
};

/**
 * Asks OMDb over the network, handing back the answer as data the rest of this can read.
 *
 * @param url - What to ask.
 * @param init - How long to wait.
 * @returns Whether it answered well, and what it said.
 */
const fetchFromOmdb: Fetcher = async (url, init) => {
  const response = await fetch(url, init);

  return {
    ok: response.ok,
    json: async () => JsonValueSchema.parse(await response.json()),
  };
};

/**
 * Reads the Rotten Tomatoes percentage out of what OMDb says of a title: the entry whose source is
 * Rotten Tomatoes, whose value reads like `93%`.
 *
 * @param answer - OMDb's answer.
 * @returns The percentage, or nothing where OMDb gave none.
 */
const scoreIn = (answer: JsonValue): number | null => {
  const parsed = OmdbAnswerSchema.safeParse(answer);

  const value = parsed.success
    ? parsed.data.Ratings.find((rating) => rating.Source === 'Rotten Tomatoes')?.Value
    : undefined;

  const percentage = value === undefined ? Number.NaN : Number.parseInt(value, 10);

  return Number.isInteger(percentage) && percentage >= 0 && percentage <= 100 ? percentage : null;
};

/**
 * Lets a metadata provider carry a Rotten Tomatoes score as well, looked up on OMDb from the id the
 * catalogue gave the title on the other big film database.
 *
 * It asks only where a key has been set and the title has such an id, remembers each answer for a
 * day since a score does not move by the hour and the free key allows about a thousand questions a
 * day, and never lets a failure — no key, a title OMDb has never heard of, OMDb being down — cost a
 * title the rest of what it was described with. Whatever the provider it wraps offers besides
 * describing a title is left as it was.
 *
 * @param inner - The provider to add the score to.
 * @param options - Where to read the key from, and what to ask with, which a test replaces.
 * @returns A provider that says what the inner one did, and the score where it can be found.
 */
const withRottenTomatoes = (
  inner: MetadataProvider,
  {
    readApiKey,
    fetchImpl = fetchFromOmdb,
    baseUrl = 'https://www.omdbapi.com',
    onProblem,
  }: WithRottenTomatoesOptions,
): MetadataProvider => {
  const scores = createExpiringCache<number | null>(SCORE_KEPT_FOR_MS);

  const read = async (imdbId: string, key: string): Promise<number | null> => {
    const known = scores.get(imdbId);

    if (known !== undefined) {
      return known;
    }

    try {
      const answered = await fetchImpl(
        `${baseUrl}/?${new URLSearchParams({ i: imdbId, apikey: key }).toString()}`,
        { signal: AbortSignal.timeout(ANSWER_LIMIT_MS) },
      );

      if (!answered.ok) {
        onProblem?.(`OMDb answered ${imdbId} with an error`);

        return null;
      }

      const score = scoreIn(await answered.json());

      scores.set(imdbId, score);

      return score;
    } catch {
      onProblem?.(`OMDb could not be reached for ${imdbId}`);

      return null;
    }
  };

  return {
    ...inner,
    describe: async (facts) => {
      const found = await inner.describe(facts);

      if (found === null || found.imdbId === undefined) {
        return found;
      }

      const key = await readApiKey();

      if (key === '') {
        return found;
      }

      const score = await read(found.imdbId, key);

      return score === null ? found : { ...found, rottenTomatoes: score };
    },
  };
};

export { withRottenTomatoes };
