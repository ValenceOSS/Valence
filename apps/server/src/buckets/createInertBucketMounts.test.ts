import { describe, expect, it } from 'vitest';
import { createInertBucketMounts } from './createInertBucketMounts';

describe('createInertBucketMounts', () => {
  it('mounts nothing, and says every bucket cannot be mounted here', async () => {
    const mounts = createInertBucketMounts('/buckets');

    await expect(mounts.canMount()).resolves.toBe(false);
    expect(mounts.stateOf('films')).toEqual({ state: 'unavailable' });
    expect(mounts.pathOf('films')).toBe('/buckets/films');
  });
});
