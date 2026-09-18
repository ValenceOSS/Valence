import { describe, expect, it } from 'vitest';
import { createDiskUsage } from './createDiskUsage';

const counting = (bytes: number) => () => Promise.resolve({ count: 1, bytes });

describe('createDiskUsage', () => {
  it('knows nothing until it has counted', () => {
    expect(createDiskUsage({ measure: counting(10) }).read()).toBeNull();
  });

  it('remembers the last count so a reader never waits on a disk', async () => {
    const usage = createDiskUsage({ measure: counting(10) });

    await usage.refresh();

    expect(usage.read()?.bytes).toBe(10);
  });

  it('says when it looked', async () => {
    expect((await createDiskUsage({ measure: counting(1) }).refresh()).atMs).toBeGreaterThan(0);
  });

  it('gives back a way to stop counting', () => {
    const stop = createDiskUsage({ measure: counting(1), everyMs: 10 }).watch();

    expect(typeof stop).toBe('function');
    stop();
  });
});
