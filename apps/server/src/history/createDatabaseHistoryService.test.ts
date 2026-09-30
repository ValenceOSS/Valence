import { describe, expect, it } from 'vitest';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseHistoryService } from './createDatabaseHistoryService';

const STARTING_POSTGRES_MS = 60_000;

const EVENING = new Date('2026-09-30T20:00:00.000Z');

const LATER = new Date('2026-09-30T20:30:00.000Z');

const NEXT_DAY = new Date('2026-10-01T20:00:00.000Z');

describe('createDatabaseHistoryService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('hands back the viewing it opened, as it was stored', async () => {
    const { db } = await aHousehold();
    const history = createDatabaseHistoryService(db);

    const opened = await history.record('pat', 'film', {
      at: EVENING,
      secondsWatched: 600,
      isFinished: false,
    });
    const [stored] = await history.list({ kind: 'server' }, 'pat');

    expect(opened).toEqual({
      id: stored?.id,
      mediaItemId: 'film',
      title: null,
      seriesTitle: null,
      startedAt: EVENING.toISOString(),
      lastWatchedAt: EVENING.toISOString(),
      secondsWatched: 600,
      isFinished: false,
    });
  });

  it('hands back the viewing it carried on, as it now stands', async () => {
    const { db } = await aHousehold();
    const history = createDatabaseHistoryService(db);
    const opened = await history.record('pat', 'film', {
      at: EVENING,
      secondsWatched: 600,
      isFinished: false,
    });

    await expect(
      history.record('pat', 'film', { at: LATER, secondsWatched: 300, isFinished: true }),
    ).resolves.toEqual({
      id: opened?.id,
      mediaItemId: 'film',
      title: null,
      seriesTitle: null,
      startedAt: EVENING.toISOString(),
      lastWatchedAt: LATER.toISOString(),
      secondsWatched: 900,
      isFinished: true,
    });
  });

  it('hands back nothing for a glance too short to remember', async () => {
    const { db } = await aHousehold();

    await expect(
      createDatabaseHistoryService(db).record('pat', 'film', {
        at: EVENING,
        secondsWatched: 5,
        isFinished: false,
      }),
    ).resolves.toBeNull();
  });

  it('says whether a viewing was forgotten, and counts what was pruned or cleared', async () => {
    const { db } = await aHousehold();
    const history = createDatabaseHistoryService(db);
    const seen = { secondsWatched: 600, isFinished: false };
    const first = await history.record('pat', 'film', { ...seen, at: EVENING });

    await history.record('pat', 'film', { ...seen, at: NEXT_DAY });
    await history.record('sam', 'film', { ...seen, at: EVENING });
    await history.record('sam', 'film', { ...seen, at: NEXT_DAY });

    await expect(history.forget('pat', first?.id ?? '')).resolves.toBe(true);
    await expect(history.forget('pat', first?.id ?? '')).resolves.toBe(false);
    await expect(history.prune(LATER)).resolves.toBe(1);
    await expect(history.forgetAll('sam')).resolves.toBe(1);
    await expect(history.forgetAll('pat')).resolves.toBe(1);
  });
});
