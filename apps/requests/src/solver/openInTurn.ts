import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { inTime } from '@ValenceRequests/solver/inTime';
import type { Gate } from '@ValenceRequests/solver/createGate';

const OPENING_MS = 30_000;

/**
 * Opens a tab or a context when the browser's turn for opening comes round, and gives the turn up
 * if the browser takes too long, so that one opening that never finishes cannot hold up every one
 * after it. What opens after all, once given up on, is closed.
 *
 * @param opening - The turns for opening, shared by the whole browser.
 * @param open - Opens it.
 * @param ms - How long opening may take.
 * @returns What was opened.
 */
const openInTurn = <T extends { close(): Promise<void> }>(
  opening: Pick<Gate, 'run'>,
  open: () => Promise<T>,
  ms = OPENING_MS,
): Promise<T> =>
  opening.run(() =>
    inTime(open(), ms, {
      failure: () =>
        new IndexerFailure('The browser did not open a tab in time', 'CloudflareCheckFailed'),
      discard: (late) => {
        void late.close().catch(() => {});
      },
    }),
  );

export { openInTurn };
