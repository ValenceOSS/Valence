import type { Viewing } from '@ValenceContracts/schemas/Viewing';

/**
 * A film somebody watched, as their history answers with it, with whatever a test cares about
 * changed.
 *
 * @param change - What differs.
 * @returns The viewing.
 */
const aViewing = (change: Partial<Viewing> = {}): Viewing => ({
  id: 'viewing-1',
  mediaItemId: '00000000-0000-4000-8000-0000000000f1',
  title: 'Arrival',
  seriesTitle: null,
  seriesId: null,
  startedAt: '2026-09-01T20:00:00.000Z',
  lastWatchedAt: '2026-09-01T22:00:00.000Z',
  secondsWatched: 7_200,
  isFinished: true,
  ...change,
});

export { aViewing };
