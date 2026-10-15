import { describe, expect, it, vi } from 'vitest';
import { createBucketMounts } from './createBucketMounts';
import type { MountMachinery } from './MountMachinery';
import type { StoredBucket } from '@ValenceContracts/schemas/Bucket';

const BUCKET: StoredBucket = {
  id: 'films',
  name: 'Films',
  provider: 'Minio',
  endpoint: 'http://minio:9000',
  region: '',
  bucket: 'media',
  prefix: '',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
};

const aMachine = (overrides: Partial<MountMachinery> = {}) => {
  const exits: ((said: string) => void)[] = [];
  const stopped = vi.fn();
  const machinery: MountMachinery = {
    hasFuse: () => Promise.resolve(true),
    run: () => Promise.resolve({ ok: true, out: 'Films/\nShows/\n', said: '' }),
    start: vi.fn(() => ({
      onExit: (listener: (said: string) => void) => {
        exits.push(listener);
      },
      stop: stopped,
    })),
    prepare: vi.fn(() => Promise.resolve()),
    release: vi.fn(() => Promise.resolve()),
    isMounted: () => Promise.resolve(true),
    ...overrides,
  };
  const mounts = createBucketMounts({
    root: '/buckets',
    cacheRoot: '/cache/buckets',
    machinery,
    wait: () => Promise.resolve(),
  });

  return { mounts, machinery, exits, stopped };
};

describe('createBucketMounts', () => {
  it('mounts each bucket on a folder of its own and says when it is mounted', async () => {
    const { mounts, machinery } = aMachine();

    await mounts.apply([BUCKET]);

    expect(mounts.stateOf('films')).toEqual({ state: 'mounted' });
    expect(machinery.start).toHaveBeenCalledWith(
      expect.arrayContaining(['mount', 'valence:media', '/buckets/films']),
      expect.objectContaining({ RCLONE_CONFIG_VALENCE_SECRET_ACCESS_KEY: 'secret' }),
    );
  });

  it('tries nothing where this machine cannot mount', async () => {
    const { mounts, machinery } = aMachine({ hasFuse: () => Promise.resolve(false) });

    await mounts.apply([BUCKET]);

    expect(machinery.start).not.toHaveBeenCalled();
    expect(mounts.stateOf('films')).toEqual({ state: 'unavailable' });
  });

  it('says why a mount stopped', async () => {
    const { mounts, exits } = aMachine();

    await mounts.apply([BUCKET]);
    exits[0]?.('NOTICE: something\nERROR: bucket does not exist');

    expect(mounts.stateOf('films')).toEqual({
      state: 'failed',
      reason: 'NOTICE: something ERROR: bucket does not exist',
    });
  });

  it('lets go of a bucket that was taken away, and mounts a changed one again', async () => {
    const { mounts, machinery, stopped } = aMachine();

    await mounts.apply([BUCKET]);
    await mounts.apply([{ ...BUCKET, prefix: 'films' }]);

    expect(stopped).toHaveBeenCalledOnce();
    expect(machinery.start).toHaveBeenCalledTimes(2);

    await mounts.apply([]);

    expect(machinery.release).toHaveBeenCalledWith('/buckets/films');
    expect(mounts.stateOf('films')).toEqual({ state: 'unavailable' });
  });

  it('leaves an unchanged bucket mounted as it is', async () => {
    const { mounts, machinery } = aMachine();

    await mounts.apply([BUCKET]);
    await mounts.apply([BUCKET]);

    expect(machinery.start).toHaveBeenCalledOnce();
  });

  it('answers a try with the folders at the top of the bucket, or why it could not be reached', async () => {
    await expect(aMachine().mounts.test(BUCKET)).resolves.toEqual({
      kind: 'reached',
      folders: ['Films', 'Shows'],
    });

    const refusing = aMachine({
      run: () => Promise.resolve({ ok: false, out: '', said: 'AccessDenied: Access Denied' }),
    });

    await expect(refusing.mounts.test(BUCKET)).resolves.toEqual({
      kind: 'refused',
      reason: 'AccessDenied: Access Denied',
    });
  });
});
