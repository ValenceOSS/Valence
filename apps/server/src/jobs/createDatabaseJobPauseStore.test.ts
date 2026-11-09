import { beforeAll, describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { createDatabaseJobPauseStore } from './createDatabaseJobPauseStore';

const STARTING_POSTGRES_MS = 60_000;

let db: Awaited<ReturnType<typeof aMigratedDatabase>>;

beforeAll(async () => {
  db = await aMigratedDatabase();
}, STARTING_POSTGRES_MS);

describe('createDatabaseJobPauseStore', () => {
  it('says nothing is paused until something is, and keeps what was written', async () => {
    const store = createDatabaseJobPauseStore(db);

    expect(await store.read()).toEqual({ isEverythingPaused: false, jobIds: [] });

    await store.write({ isEverythingPaused: true, jobIds: ['job-1'] });
    await store.write({ isEverythingPaused: false, jobIds: ['job-1', 'job-2'] });

    expect(await store.read()).toEqual({ isEverythingPaused: false, jobIds: ['job-1', 'job-2'] });
  });
});
