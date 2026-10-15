import { join } from 'node:path';
import { say } from '@ValenceI18n/say';
import { mountArguments } from './mountArguments';
import { rcloneEnvironment } from './rcloneEnvironment';
import { remoteOf } from './remoteOf';
import type { BucketMounts } from './BucketMounts';
import type { MountMachinery, MountProcess } from './MountMachinery';
import type { BucketState, StoredBucket } from '@ValenceContracts/schemas/Bucket';

const MOUNTED_WITHIN_MS = 30_000;

const LOOKS_EVERY_MS = 500;

const TRIES_AGAIN_AFTER_MS = 30_000;

const TESTED_WITHIN_MS = 20_000;

const MOST_FOLDERS_SHOWN = 20;

type Mount = {
  key: string;
  state: BucketState;
  running: MountProcess | null;
  retry: ReturnType<typeof setTimeout> | null;
};

type CreateBucketMountsOptions = {
  root: string;
  cacheRoot: string;
  machinery: MountMachinery;
  wait?: (ms: number) => Promise<void>;
};

/**
 * Trims what rclone said down to the line or two that say why, for an administrator to read.
 *
 * @param said - Everything it wrote to its error stream.
 * @returns The last of it that says anything.
 */
const whyFrom = (said: string): string => {
  const lines = said
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  return (lines.slice(-2).join(' ') || say('server.buckets.rcloneStoppedWithoutSayingWhy')).slice(
    0,
    400,
  );
};

/**
 * Keeps every bucket an administrator added mounted as a folder of its own, under one root, so a
 * library can be pointed at it like any folder on disk and everything that reads or writes a
 * library — the scan, the media service, downloads, requests — works on it unchanged.
 *
 * Each bucket is mounted by an rclone of its own, told about the bucket through its environment. A
 * mount that fails, or stops, is tried again half a minute later, and why it failed is kept for the
 * administrator to read. Where this machine cannot mount at all — no rclone, or no FUSE — nothing is
 * tried and every bucket says so.
 *
 * @param options - The folder buckets are mounted under, where their caches go, and the processes
 *   and files the mounting is done with.
 * @returns The mounts.
 */
const createBucketMounts = ({
  root,
  cacheRoot,
  machinery,
  wait = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
}: CreateBucketMountsOptions): BucketMounts => {
  const mounts = new Map<string, Mount>();
  let able: Promise<boolean> | null = null;

  const canMount = () => {
    able ??= Promise.all([machinery.hasFuse(), machinery.run(['version'], {}, TESTED_WITHIN_MS)])
      .then(([hasFuse, ran]) => hasFuse && ran.ok)
      .catch(() => false);

    return able;
  };

  const pathOf = (id: string) => join(root, id);

  const stop = async (id: string) => {
    const mount = mounts.get(id);

    if (mount === undefined) {
      return;
    }

    mounts.delete(id);

    if (mount.retry !== null) {
      clearTimeout(mount.retry);
    }

    mount.running?.stop();
    await machinery.release(pathOf(id)).catch(() => undefined);
  };

  const start = async (bucket: StoredBucket, key: string): Promise<void> => {
    const mount: Mount = { key, state: { state: 'mounting' }, running: null, retry: null };
    const target = pathOf(bucket.id);
    const isCurrent = () => mounts.get(bucket.id) === mount;

    mounts.set(bucket.id, mount);

    await machinery.prepare(target, join(cacheRoot, bucket.id)).catch(() => undefined);

    if (!isCurrent()) {
      return;
    }

    const running = machinery.start(
      mountArguments(remoteOf(bucket), target, join(cacheRoot, bucket.id)),
      rcloneEnvironment(bucket),
    );

    mount.running = running;

    running.onExit((said) => {
      if (!isCurrent()) {
        return;
      }

      mount.state = { state: 'failed', reason: whyFrom(said) };
      mount.running = null;
      void machinery.release(target).catch(() => undefined);
      mount.retry = setTimeout(() => {
        if (isCurrent()) {
          void start(bucket, key);
        }
      }, TRIES_AGAIN_AFTER_MS);
    });

    for (let waited = 0; waited < MOUNTED_WITHIN_MS; waited += LOOKS_EVERY_MS) {
      if (!isCurrent() || mount.state.state !== 'mounting') {
        return;
      }

      if (await machinery.isMounted(target).catch(() => false)) {
        mount.state = { state: 'mounted' };

        return;
      }

      await wait(LOOKS_EVERY_MS);
    }

    if (isCurrent() && mount.state.state === 'mounting') {
      mount.state = {
        state: 'failed',
        reason: say('server.buckets.rcloneDidNotMountTheBucketInTime'),
      };
    }
  };

  return {
    canMount,
    pathOf,

    apply: async (buckets) => {
      const wanted = new Map(buckets.map((bucket) => [bucket.id, bucket]));

      for (const [id, mount] of mounts) {
        const bucket = wanted.get(id);

        if (bucket === undefined || JSON.stringify(bucket) !== mount.key) {
          await stop(id);
        }
      }

      if (!(await canMount())) {
        return;
      }

      await Promise.all(
        buckets
          .filter((bucket) => !mounts.has(bucket.id))
          .map((bucket) => start(bucket, JSON.stringify(bucket))),
      );
    },

    stateOf: (id) => mounts.get(id)?.state ?? { state: 'unavailable' },

    test: async (bucket) => {
      const ran = await machinery
        .run(
          ['lsf', remoteOf(bucket), '--dirs-only', '--max-depth', '1'],
          rcloneEnvironment(bucket),
          TESTED_WITHIN_MS,
        )
        .catch((failure: Error) => ({ ok: false, out: '', said: failure.message }));

      return ran.ok
        ? {
            kind: 'reached',
            folders: ran.out
              .split('\n')
              .map((line) => line.trim().replace(/\/$/u, ''))
              .filter((line) => line !== '')
              .slice(0, MOST_FOLDERS_SHOWN),
          }
        : { kind: 'refused', reason: whyFrom(ran.said) };
    },
  };
};

export { createBucketMounts };
