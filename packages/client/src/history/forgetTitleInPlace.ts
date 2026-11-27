import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { A_PAGE, fetchHistory, forgetViewing } from '@ValenceClient/history/fetchHistory';
import { forgetWatchedTitle } from '@ValenceClient/history/forgetWatchedTitle';
import { titleKeyOfViewing } from '@ValenceClient/history/titleKeyOfViewing';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { WatchedTitle } from '@ValenceClient/history/groupHistory';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';

/**
 * Reads every viewing of one title in this profile's whole history, a page at a time, for a server
 * that cannot forget a title by itself.
 *
 * @param key - The title's key.
 * @returns The ids of its viewings.
 */
const everyViewingOf = async (key: string): Promise<string[]> => {
  const found: string[] = [];

  for (let offset = 0; ; offset += A_PAGE) {
    const page = await fetchHistory(offset);

    found.push(...page.filter((one) => titleKeyOfViewing(one) === key).map((one) => one.id));

    if (page.length < A_PAGE) {
      return found;
    }
  }
};

/**
 * Takes a film, or a whole programme, off this profile's history — every viewing of it, not only
 * those read so far — at once on screen, and reads the history again where the server kept any.
 * A server that can forget a title is asked to; an older one is read through and asked to forget
 * each viewing of it.
 *
 * @param cache - The query cache the screens read from.
 * @param watched - The film or programme.
 * @param canForgetTitle - Whether the server can forget a whole title at once.
 * @returns Whether the server forgot all of it.
 */
const forgetTitleInPlace = async (
  cache: QueryClient,
  watched: WatchedTitle,
  canForgetTitle: boolean,
): Promise<boolean> => {
  const historyKey = viewingQueries.history().queryKey;

  await cache.cancelQueries({ queryKey: historyKey, exact: true });

  cache.setQueryData(historyKey, (held: InfiniteData<Viewing[]> | undefined) =>
    held === undefined
      ? held
      : {
          ...held,
          pages: held.pages.map((page) =>
            page.filter((one) => titleKeyOfViewing(one) !== watched.key),
          ),
        },
  );

  const isForgotten = await (
    canForgetTitle
      ? forgetWatchedTitle(watched.latest.mediaItemId).then(() => true)
      : everyViewingOf(watched.key).then(async (ids) =>
          (
            await Promise.all(
              [...new Set([...watched.viewingIds, ...ids])].map(async (id) => forgetViewing(id)),
            )
          ).every((answer) => answer),
        )
  ).catch(() => false);

  if (!isForgotten) {
    await cache.invalidateQueries({ queryKey: historyKey });
  }

  return isForgotten;
};

export { forgetTitleInPlace };
