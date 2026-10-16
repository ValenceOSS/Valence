import { join } from 'node:path';
import { say } from '@ValenceI18n/say';
import type { BucketMounts } from './BucketMounts';

/**
 * Mounts nothing, for a server started without the means to — a test, or a machine where buckets
 * were never set up — so every bucket reads as one this machine cannot mount.
 *
 * @param root - Where buckets would be mounted.
 * @returns The mounts.
 */
const createInertBucketMounts = (root = '/buckets'): BucketMounts => ({
  canMount: () => Promise.resolve(false),
  apply: () => Promise.resolve(),
  stateOf: () => ({ state: 'unavailable' }),
  pathOf: (id) => join(root, id),
  test: () =>
    Promise.resolve({ kind: 'refused', reason: say('server.buckets.bucketsCannotBeMountedHere') }),
});

export { createInertBucketMounts };
