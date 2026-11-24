import { titleKeyOfViewing } from '@ValenceClient/history/titleKeyOfViewing';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';

type WatchedTitle = {
  key: string;
  latest: Viewing;
  viewingIds: string[];
};

/**
 * Puts a history together by title, most recently watched first, so a programme stands once at the
 * episode watched last and a film watched twice stands once.
 *
 * @param viewings - What was watched, in any order.
 * @returns Each title once, with its latest viewing and every viewing of it.
 */
const groupHistory = (viewings: readonly Viewing[]): WatchedTitle[] => {
  const byTitle = new Map<string, WatchedTitle>();
  const newestFirst = [...viewings].sort(
    (left, right) => Date.parse(right.lastWatchedAt) - Date.parse(left.lastWatchedAt),
  );

  for (const viewing of newestFirst) {
    const key = titleKeyOfViewing(viewing);
    const held = byTitle.get(key);

    byTitle.set(
      key,
      held === undefined
        ? { key, latest: viewing, viewingIds: [viewing.id] }
        : { ...held, viewingIds: [...held.viewingIds, viewing.id] },
    );
  }

  return [...byTitle.values()];
};

export type { WatchedTitle };

export { groupHistory };
