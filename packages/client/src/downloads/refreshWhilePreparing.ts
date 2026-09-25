import type { Download } from '@ValenceContracts/schemas/Download';

const WHILE_PREPARING_MS = 10_000;

/**
 * How often to ask for the downloads again: slowly while any is still being prepared, and not at
 * all once none is.
 *
 * @param downloads - What the list holds now, or nothing before it has been read.
 * @returns The interval in milliseconds, or false.
 */
const refreshWhilePreparing = (downloads: readonly Download[] | undefined): number | false =>
  (downloads ?? []).some(
    (download) => download.state === 'queued' || download.state === 'preparing',
  )
    ? WHILE_PREPARING_MS
    : false;

export { refreshWhilePreparing };
