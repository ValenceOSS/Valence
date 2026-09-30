import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authSchema, valenceSchema } from '#dialect/Schema';
import { createDatabaseWatchProgressService } from './createDatabaseWatchProgressService';

const STARTING_POSTGRES_MS = 30_000;

const EPISODES = 80;

/**
 * A Postgres of its own, in memory, holding the progress table and nothing it refers to.
 *
 * @returns The database.
 */
const aScratchDatabase = async () => {
  const client = new PGlite();

  await client.exec(`
    CREATE TABLE "watch_progress" (
      "id" text PRIMARY KEY,
      "profileId" text NOT NULL,
      "mediaItemId" text NOT NULL,
      "positionSeconds" real NOT NULL,
      "durationSeconds" real NOT NULL,
      "isFinished" boolean NOT NULL DEFAULT false,
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX "watch_progress_profile_idx" ON "watch_progress" ("profileId", "mediaItemId");
  `);

  return drizzle(client, { schema: { ...authSchema, ...valenceSchema } });
};

/**
 * Marks as many episodes finished as it is told to, one after another.
 *
 * @param progress - Where to record them.
 * @param profileId - Who watched them.
 * @param count - How many episodes.
 */
const finishEpisodes = async (
  progress: ReturnType<typeof createDatabaseWatchProgressService>,
  profileId: string,
  count: number,
): Promise<void> => {
  for (let episode = 0; episode < count; episode += 1) {
    vi.setSystemTime(Date.UTC(2026, 8, 29, 20, episode));
    await progress.record(profileId, {
      mediaId: `episode-${episode.toString()}`,
      positionSeconds: 1500,
      durationSeconds: 1500,
      isFinished: true,
    });
  }
};

describe('createDatabaseWatchProgressService', { timeout: STARTING_POSTGRES_MS }, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists everything somebody has watched, not only the latest few', async () => {
    const progress = createDatabaseWatchProgressService(await aScratchDatabase());

    await finishEpisodes(progress, 'dan', EPISODES);

    const listed = await progress.list('dan');

    expect(listed).toHaveLength(EPISODES);
    expect(listed.every((entry) => entry.isFinished)).toBe(true);
  });

  it('lists the most recent first', async () => {
    const progress = createDatabaseWatchProgressService(await aScratchDatabase());

    vi.useFakeTimers({ toFake: ['Date'] });
    await finishEpisodes(progress, 'dan', 3);

    const listed = await progress.list('dan');

    expect(listed[0]?.mediaId).toBe('episode-2');
  });

  it('keeps one viewer out of what another has watched', async () => {
    const progress = createDatabaseWatchProgressService(await aScratchDatabase());

    await finishEpisodes(progress, 'dan', 2);

    await expect(progress.list('somebody else')).resolves.toEqual([]);
  });

  it('forgets an episode taken back, leaving the rest', async () => {
    const progress = createDatabaseWatchProgressService(await aScratchDatabase());

    await finishEpisodes(progress, 'dan', 2);
    await progress.forget('dan', 'episode-0');

    await expect(progress.read('dan', 'episode-0')).resolves.toBeNull();
    await expect(progress.read('dan', 'episode-1')).resolves.toMatchObject({ isFinished: true });
  });

  it('moves the one record of an item on, rather than adding another', async () => {
    const progress = createDatabaseWatchProgressService(await aScratchDatabase());

    await progress.record('dan', {
      mediaId: 'film',
      positionSeconds: 60,
      durationSeconds: 5400,
      isFinished: false,
    });
    await progress.record('dan', {
      mediaId: 'film',
      positionSeconds: 3000,
      durationSeconds: 5400,
      isFinished: false,
    });

    const listed = await progress.list('dan');

    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ positionSeconds: 3000 });
  });
});
