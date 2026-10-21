import { z } from 'zod';
import type { Query, QueryClient, QueryKey } from '@tanstack/react-query';
import { KEPT_QUERIES } from '@ValenceClient/query/KEPT_QUERIES';
import type { KeptQuery } from '@ValenceClient/query/KEPT_QUERIES';
import type { KeptAnswers } from '@ValenceClient/platform/Platform.types';

const KEPT_FOR_MS = 30 * 86_400_000;

/**
 * Which of the kept queries a query is, by its key, or by the start of it for one asked of
 * particular libraries or ranges.
 *
 * @param queryKey - The query's key.
 * @returns The kept query, or nothing where it is not one.
 */
const keptQueryOf = (queryKey: QueryKey): KeptQuery | null =>
  KEPT_QUERIES.find(
    (kept) =>
      (!kept.isExact || queryKey.length === kept.key.length) &&
      kept.key.every((part, index) => queryKey[index] === part),
  ) ?? null;

/**
 * Reads one kept answer back, refusing anything that no longer reads as that query's answer.
 *
 * @param text - What was written for it.
 * @param keptQuery - Which query it answers.
 * @returns The answer and when the server gave it, or nothing where it cannot be read.
 */
const readKept = (text: string, keptQuery: KeptQuery) => {
  try {
    const read = z
      .object({ updatedAt: z.number(), data: keptQuery.schema })
      .safeParse(JSON.parse(text));

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

/**
 * Keeps the answers to the slow admin queries on this device for one account, so a panel that has
 * been read before opens on what it showed last time while it asks the server again.
 *
 * What was kept is read once, then handed to each query as it appears, or straight away to one that
 * is already there. A query that already has an answer keeps it, and one given a kept answer is
 * marked out of date, so whatever shows it asks again. Every fresh answer from the server is written
 * back.
 *
 * @param answers - The cache to fill and watch.
 * @param accountId - Whose answers these are.
 * @param kept - Where this device keeps them.
 * @returns A function that stops keeping them.
 */
const keepAnswers = (answers: QueryClient, accountId: string, kept: KeptAnswers): (() => void) => {
  const known = new Map<string, string>();
  let isStopped = false;

  const fill = (query: Query) => {
    const text = known.get(query.queryHash);
    const keptQuery = keptQueryOf(query.queryKey);

    if (text === undefined || keptQuery === null || query.state.data !== undefined) {
      return;
    }

    const stored = readKept(text, keptQuery);

    if (stored === null || Date.now() - stored.updatedAt > KEPT_FOR_MS) {
      return;
    }

    answers.setQueryData(query.queryKey, stored.data, { updatedAt: stored.updatedAt });
    void answers.invalidateQueries({ queryKey: query.queryKey, exact: true, refetchType: 'none' });
  };

  const stopWatching = answers.getQueryCache().subscribe((event) => {
    const query = answers.getQueryCache().get(event.query.queryHash);

    if (query === undefined) {
      return;
    }

    if (event.type === 'added') {
      fill(query);

      return;
    }

    if (
      event.type !== 'updated' ||
      event.action.type !== 'success' ||
      event.action.manual === true ||
      keptQueryOf(query.queryKey) === null
    ) {
      return;
    }

    const text = JSON.stringify({ updatedAt: query.state.dataUpdatedAt, data: query.state.data });

    known.set(query.queryHash, text);
    void kept.write(accountId, query.queryHash, text).catch(() => {});
  });

  void kept
    .readAll(accountId)
    .then((stored) => {
      if (isStopped) {
        return;
      }

      for (const one of stored) {
        if (!known.has(one.key)) {
          known.set(one.key, one.text);
        }
      }

      for (const query of answers.getQueryCache().getAll()) {
        fill(query);
      }
    })
    .catch(() => {});

  return () => {
    isStopped = true;
    stopWatching();
  };
};

export { keepAnswers };
