import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { jobSchedule, queuedJob } from '#dialect/Schema';
import { createJobQueue } from './createJobQueue';
import type { JobQueue } from './JobQueue';

const STARTING_POSTGRES_MS = 60_000;

const CHECK_DISK = 'server.checkDiskSpace';

const SCAN = 'library.scan';

const TRICKPLAY = 'library.regenerateTrickplay';

type Database = Awaited<ReturnType<typeof aMigratedDatabase>>;

type Gate = { passed: Promise<void>; open: () => void; fail: (error: Error) => void };

/**
 * Builds a promise a test opens or breaks when it chooses, to hold a job running for as long as the
 * test needs it to be.
 *
 * @returns The promise, and the two ways to settle it.
 */
const aGate = (): Gate => {
  let open = (): void => {};
  let fail: (error: Error) => void = () => {};
  const passed = new Promise<void>((resolve, reject) => {
    open = resolve;
    fail = reject;
  });

  return { passed, open, fail };
};

let db: Database;

const started: JobQueue[] = [];

/**
 * Starts a queue on the test's database that looks for work every few milliseconds, and remembers it
 * so it is stopped after the test.
 *
 * @param options - Everything but the database.
 * @returns The queue.
 */
const aQueue = (options: Omit<Parameters<typeof createJobQueue>[0], 'db'>): JobQueue => {
  const queue = createJobQueue({ db, pollEveryMs: 5, ...options });

  started.push(queue);

  return queue;
};

/**
 * Reads a job's row as it stands.
 *
 * @param id - The job.
 * @returns Its row.
 */
const rowOf = async (id: string | null) => {
  const [row] = await db
    .select()
    .from(queuedJob)
    .where(eq(queuedJob.id, id ?? ''))
    .limit(1);

  return row;
};

beforeAll(async () => {
  db = await aMigratedDatabase();
}, STARTING_POSTGRES_MS);

beforeEach(async () => {
  await db.delete(queuedJob);
  await db.delete(jobSchedule);
});

afterEach(async () => {
  await Promise.all(started.map((queue) => queue.stop()));
  started.length = 0;
});

describe('createJobQueue', () => {
  it('runs a job that carries nothing, which is every job on a clock', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const queue = aQueue({ handlers: { [CHECK_DISK]: handler } });

    await queue.startWorking();

    const id = await queue.enqueue(CHECK_DISK, {});

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith(id, {});
    });
  });

  it('reports a job that finished as finished, and remembers that it did', async () => {
    const onFinished = vi.fn();
    const queue = aQueue({ handlers: { [CHECK_DISK]: () => Promise.resolve() }, onFinished });

    await queue.startWorking();

    const id = await queue.enqueue(CHECK_DISK, {});

    await vi.waitFor(async () => {
      expect(await queue.readState(id ?? '')).toBe('completed');
    });
    expect(onFinished).toHaveBeenCalledWith({
      kind: CHECK_DISK,
      jobId: id,
      subject: null,
      reason: null,
      wasStopped: false,
    });
  });

  it('counts a stopped job that threw on its way out as stopped, and does not try it again', async () => {
    const onFinished = vi.fn();
    const gate = aGate();
    const handler = vi.fn(() => gate.passed);
    const queue = aQueue({ handlers: { [TRICKPLAY]: handler }, onFinished });

    await queue.startWorking();

    const id = await queue.enqueue(TRICKPLAY, { libraryId: 'films' });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });
    await expect(queue.cancel(id ?? '')).resolves.toBe(true);

    gate.fail(new Error('The media service rejected /trickplay.'));

    await vi.waitFor(async () => {
      expect((await rowOf(id))?.state).toBe('cancelled');
    });
    expect(onFinished).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: id, reason: null, wasStopped: true }),
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('says a job that ended because it was asked to stop was stopped', async () => {
    const onFinished = vi.fn();
    const gate = aGate();
    const handler = vi.fn(() => gate.passed);
    const queue = aQueue({ handlers: { [SCAN]: handler }, onFinished });

    await queue.startWorking();

    const id = await queue.enqueue(SCAN, { libraryId: 'films' });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });
    await queue.cancel(id ?? '');
    gate.open();

    await vi.waitFor(() => {
      expect(onFinished).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: id, reason: null, wasStopped: true }),
      );
    });
  });

  it('says what a job is about, from the library its payload names or else its subject', async () => {
    const onFinished = vi.fn();
    const handler = vi.fn(() => Promise.resolve());
    const queue = aQueue({
      handlers: { [SCAN]: handler, 'server.prepareDownload': () => Promise.resolve() },
      onFinished,
    });

    await queue.startWorking();

    const scan = await queue.enqueue(SCAN, { libraryId: 'films', force: true });
    const download = await queue.enqueue('server.prepareDownload', { subject: 'Arrival' });

    await vi.waitFor(() => {
      expect(onFinished).toHaveBeenCalledTimes(2);
    });
    expect(handler).toHaveBeenCalledWith(scan, { libraryId: 'films', force: true });
    expect(onFinished).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: scan, subject: 'films' }),
    );
    expect(onFinished).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: download, subject: 'Arrival' }),
    );
  });

  it('has the run on record before the work that amends it begins', async () => {
    const order: string[] = [];
    const recorded = aGate();
    const handler = vi.fn(() => {
      order.push('handler');

      return Promise.resolve();
    });
    const queue = aQueue({
      handlers: { [CHECK_DISK]: handler },
      onStarted: async () => {
        order.push('started');
        await recorded.passed;
        order.push('recorded');
      },
      onFinished: () => {
        order.push('finished');
      },
    });

    await queue.startWorking();
    await queue.enqueue(CHECK_DISK, {});

    await vi.waitFor(() => {
      expect(order).toEqual(['started']);
    });
    expect(handler).not.toHaveBeenCalled();

    recorded.open();

    await vi.waitFor(() => {
      expect(order).toEqual(['started', 'recorded', 'handler', 'finished']);
    });
  });

  it('reports progress as the running job announces it', async () => {
    const onProgress = vi.fn();
    const gate = aGate();
    const queue: JobQueue = aQueue({
      handlers: {
        [CHECK_DISK]: (jobId) => {
          queue.reportProgress(jobId, 'checking', 1, 2);

          return gate.passed;
        },
      },
      onProgress,
    });

    await queue.startWorking();

    const id = await queue.enqueue(CHECK_DISK, {});

    await vi.waitFor(() => {
      expect(queue.readProgress(id ?? '')).toEqual({
        phase: 'checking',
        processed: 1,
        total: 2,
        item: null,
      });
    });
    expect(queue.listRunning()).toEqual([expect.objectContaining({ jobId: id, kind: CHECK_DISK })]);
    expect(onProgress).toHaveBeenCalledWith({
      jobId: id,
      phase: 'checking',
      processed: 1,
      total: 2,
      item: null,
    });

    gate.open();
  });

  it('fails a job that has had every try its kind allows, saying why', async () => {
    const onFinished = vi.fn();
    const handler = vi.fn(() => Promise.reject(new Error('the disk is gone')));
    const queue = aQueue({
      handlers: { [CHECK_DISK]: handler },
      perKind: { [CHECK_DISK]: { retries: 0 } },
      onFinished,
    });

    await queue.startWorking();

    const id = await queue.enqueue(CHECK_DISK, {});

    await vi.waitFor(async () => {
      expect(await rowOf(id)).toMatchObject({ state: 'failed', lastError: 'the disk is gone' });
    });
    expect(onFinished).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: id, reason: 'the disk is gone', wasStopped: false }),
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('puts a job that failed back to wait a while, where its kind allows another try', async () => {
    const queue = aQueue({
      handlers: { [CHECK_DISK]: () => Promise.reject(new Error('not yet')) },
    });

    await queue.startWorking();

    const id = await queue.enqueue(CHECK_DISK, {});

    await vi.waitFor(async () => {
      expect(await rowOf(id)).toMatchObject({ state: 'queued', attempts: 1, lastError: 'not yet' });
    });
    expect((await rowOf(id))?.runAfter.getTime()).toBeGreaterThan(Date.now());
  });

  it('runs nothing until it is told to start, so a handler cannot fire mid-assembly', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const queue = aQueue({ handlers: { [CHECK_DISK]: handler } });

    await queue.enqueue(CHECK_DISK, {});
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(handler).not.toHaveBeenCalled();

    await queue.startWorking();

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });
  });

  it('holds a job back for a while, for work that has to be asked for again later', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const queue = aQueue({ handlers: { [SCAN]: handler } });

    await queue.startWorking();

    const id = await queue.enqueueAfter(SCAN, { libraryId: 'films' }, 30, 'films');

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(handler).not.toHaveBeenCalled();
    expect((await rowOf(id))?.runAfter.getTime()).toBeGreaterThan(Date.now() + 25_000);
  });

  it('keeps one job waiting under a key, and gives the key up once that job starts', async () => {
    const gate = aGate();
    const handler = vi.fn(() => gate.passed);
    const queue = aQueue({ handlers: { [SCAN]: handler } });

    const first = await queue.enqueue(SCAN, { libraryId: 'films' }, 'films');

    await expect(queue.enqueue(SCAN, { libraryId: 'films' }, 'films')).resolves.toBeNull();
    await expect(queue.enqueue(SCAN, { libraryId: 'shows' }, 'shows')).resolves.not.toBeNull();

    await queue.startWorking();

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith(first, { libraryId: 'films' });
    });
    await expect(queue.enqueue(SCAN, { libraryId: 'films' }, 'films')).resolves.not.toBeNull();

    gate.open();
  });

  it('runs as many of a kind at once as that kind is set to', async () => {
    const gate = aGate();
    const handler = vi.fn(() => gate.passed);
    const queue = aQueue({
      handlers: { 'server.prepareDownload': handler },
      perKind: { 'server.prepareDownload': { atOnce: 2 } },
    });

    await queue.startWorking();

    for (const subject of ['Arrival', 'Heat', 'Alien']) {
      await queue.enqueue('server.prepareDownload', { subject });
    }

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(2);
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(handler).toHaveBeenCalledTimes(2);

    gate.open();

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  it('stops what a library has running, and drops what it has waiting', async () => {
    const gate = aGate();
    const handler = vi.fn(() => gate.passed);
    const queue = aQueue({ handlers: { [SCAN]: handler, [TRICKPLAY]: () => gate.passed } });

    await queue.startWorking();

    const scanning = await queue.enqueue(SCAN, { libraryId: 'films' });
    const sheets = await queue.enqueue(TRICKPLAY, { libraryId: 'films' });

    await vi.waitFor(() => {
      expect(queue.listRunning()).toHaveLength(2);
    });

    const waiting = await queue.enqueue(SCAN, { libraryId: 'films' });
    const elsewhere = await queue.enqueue(SCAN, { libraryId: 'shows' });

    await expect(queue.cancelFor('films')).resolves.toBe(3);
    expect(queue.isCancelled(scanning ?? '')).toBe(true);
    expect(queue.isCancelled(sheets ?? '')).toBe(true);
    expect((await rowOf(waiting))?.state).toBe('cancelled');
    expect((await rowOf(elsewhere))?.state).toBe('queued');

    gate.open();
  });

  it('drops a job that is only waiting, and says so only where there was one to drop', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const queue = aQueue({ handlers: { [SCAN]: handler } });
    const id = await queue.enqueue(SCAN, { libraryId: 'films' });

    await expect(queue.cancel(id ?? '')).resolves.toBe(true);
    await expect(queue.cancel(id ?? '')).resolves.toBe(false);
    await expect(queue.cancel('nothing-by-that-name')).resolves.toBe(false);
    await expect(queue.readState(id ?? '')).resolves.toBe('failed');

    await queue.startWorking();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('names the job a library already has going, running or waiting', async () => {
    const gate = aGate();
    const queue = aQueue({
      handlers: { [SCAN]: () => gate.passed, [CHECK_DISK]: () => gate.passed },
    });

    const waiting = await queue.enqueue(SCAN, { libraryId: 'shows' }, 'shows');

    await expect(queue.liveJob(SCAN, 'shows')).resolves.toBe(waiting);

    await queue.startWorking();

    const housekeeping = await queue.enqueue(CHECK_DISK, {});

    await vi.waitFor(() => {
      expect(queue.listRunning()).toHaveLength(2);
    });
    await expect(queue.liveJob(SCAN, 'shows')).resolves.toBe(waiting);
    await expect(queue.liveJob(SCAN, 'films')).resolves.toBeNull();
    await expect(queue.liveJob(CHECK_DISK)).resolves.toBe(housekeeping);

    gate.open();
  });

  it('keeps one schedule per key, and forgets it when told to', async () => {
    const queue = aQueue({ handlers: { [CHECK_DISK]: () => Promise.resolve() } });

    await queue.setSchedule(CHECK_DISK, 'default', '0 * * * *', 'UTC');
    await queue.setSchedule(CHECK_DISK, 'default', '*/15 * * * *', 'Europe/London');

    await expect(queue.listSchedules()).resolves.toEqual([
      { queueName: CHECK_DISK, key: 'default', cron: '*/15 * * * *', timezone: 'Europe/London' },
    ]);

    await queue.clearSchedule(CHECK_DISK, 'default');

    await expect(queue.listSchedules()).resolves.toEqual([]);
  });

  it('sends the job for a schedule whose moment has come, and moves it on to the next', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const queue = aQueue({ handlers: { [CHECK_DISK]: handler } });

    await db.insert(jobSchedule).values({
      queueName: CHECK_DISK,
      key: 'default',
      cron: '*/15 * * * *',
      timezone: 'UTC',
      nextRunAt: new Date(Date.now() - 1000),
    });

    await queue.startWorking();

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith(expect.any(String), {});
    });

    const [schedule] = await db.select().from(jobSchedule);

    expect(schedule?.nextRunAt.getTime()).toBeGreaterThan(Date.now());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('takes up again what the last server left running, unless it had used every try', async () => {
    const handler = vi.fn(() => Promise.resolve());
    const queue = aQueue({ handlers: { [SCAN]: handler } });
    const left = { kind: SCAN, payload: {}, state: 'running', runAfter: new Date(0) };

    await db.insert(queuedJob).values([
      { ...left, id: 'interrupted', attempts: 1, retryLimit: 2 },
      { ...left, id: 'worn-out', attempts: 3, retryLimit: 2 },
    ]);

    await queue.startWorking();

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith('interrupted', {});
    });
    expect(handler).not.toHaveBeenCalledWith('worn-out', {});
    expect((await rowOf('worn-out'))?.state).toBe('failed');
  });

  it('forgets jobs that ended more than a week ago', async () => {
    const queue = aQueue({ handlers: { [SCAN]: () => Promise.resolve() } });
    const ended = {
      kind: SCAN,
      payload: {},
      state: 'completed',
      retryLimit: 2,
      runAfter: new Date(0),
    };

    await db.insert(queuedJob).values([
      { ...ended, id: 'old', finishedAt: new Date(Date.now() - 8 * 86_400_000) },
      { ...ended, id: 'recent', finishedAt: new Date(Date.now() - 86_400_000) },
    ]);

    await queue.startWorking();

    expect(await rowOf('old')).toBeUndefined();
    expect(await rowOf('recent')).toBeDefined();
  });
});
