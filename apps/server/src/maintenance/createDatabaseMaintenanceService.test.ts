import { describe, expect, it, vi } from 'vitest';
import { createInertJobQueue } from '@ValenceServer/jobs/createInertJobQueue';
import { createDatabaseMaintenanceService } from './createDatabaseMaintenanceService';

describe('createDatabaseMaintenanceService', () => {
  it('queues the job under its own kind as a singleton key', async () => {
    const enqueue = vi.fn(() => Promise.resolve('job-1'));
    const maintenance = createDatabaseMaintenanceService({
      jobs: createInertJobQueue({ enqueue }),
    });

    const queued = await maintenance.run('server.cleanupImageCache');

    expect(enqueue).toHaveBeenCalledWith(
      'server.cleanupImageCache',
      {},
      'server.cleanupImageCache',
    );
    expect(queued).toEqual({ jobId: 'job-1', state: 'queued' });
  });

  it('queues whichever kind it is handed, rather than a list it has to be taught', async () => {
    const enqueue = vi.fn(() => Promise.resolve('job-2'));
    const maintenance = createDatabaseMaintenanceService({
      jobs: createInertJobQueue({ enqueue }),
    });

    await maintenance.run('server.checkTranscoder');
    await maintenance.run('server.pruneJobHistory');

    expect(enqueue).toHaveBeenNthCalledWith(
      1,
      'server.checkTranscoder',
      {},
      'server.checkTranscoder',
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      2,
      'server.pruneJobHistory',
      {},
      'server.pruneJobHistory',
    );
  });

  it('answers with the job already doing it rather than inventing an id', async () => {
    const maintenance = createDatabaseMaintenanceService({
      jobs: createInertJobQueue({
        enqueue: () => Promise.resolve(null),
        liveJob: () => Promise.resolve('job-already-going'),
      }),
    });

    const queued = await maintenance.run('server.cleanupSessions');

    expect(queued).toEqual({ jobId: 'job-already-going', state: 'running' });
  });

  it('asks for the job of that kind, whichever library it is about', async () => {
    const liveJob = vi.fn(() => Promise.resolve('job-already-going'));
    const maintenance = createDatabaseMaintenanceService({
      jobs: createInertJobQueue({ enqueue: () => Promise.resolve(null), liveJob }),
    });

    await maintenance.run('server.cleanupSessions');

    expect(liveJob).toHaveBeenCalledWith('server.cleanupSessions');
  });

  it('says there is no job rather than naming one that does not exist', async () => {
    const maintenance = createDatabaseMaintenanceService({
      jobs: createInertJobQueue({
        enqueue: () => Promise.resolve(null),
        liveJob: () => Promise.resolve(null),
      }),
    });

    expect(await maintenance.run('server.cleanupSessions')).toEqual({
      jobId: null,
      state: 'unavailable',
    });
  });
});
