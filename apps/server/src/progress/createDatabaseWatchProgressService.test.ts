import { afterEach, describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, user, viewerProfile } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createDatabaseWatchProgressService } from './createDatabaseWatchProgressService';

const STARTING_THE_DATABASE_MS = 60_000;

const EPISODES = 80;

/**
 * A migrated database holding two viewers and the episodes and film they watch, which is what a
 * progress record refers to.
 *
 * @returns The database.
 */
const aScratchDatabase = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'account', name: 'Dan', email: 'dan@example.test' });
  await db.insert(viewerProfile).values([
    { id: 'dan', userId: 'account', name: 'Dan', colour: 'red' },
    { id: 'somebody else', userId: 'account', name: 'Somebody', colour: 'blue' },
  ]);
  await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' });
  await db
    .insert(mediaItem)
    .values([
      ...Array.from({ length: EPISODES }, (_, episode) =>
        aMediaItemRow(`episode-${episode.toString()}`, 'shows'),
      ),
      aMediaItemRow('film', 'shows'),
    ]);

  return db;
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

describe('createDatabaseWatchProgressService', { timeout: STARTING_THE_DATABASE_MS }, () => {
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
