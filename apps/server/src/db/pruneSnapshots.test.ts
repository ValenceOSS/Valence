import { describe, expect, it, vi } from 'vitest';
import { pruneSnapshots } from '@ValenceServer/db/pruneSnapshots';

describe('pruneSnapshots', () => {
  it('deletes all but the newest few', async () => {
    const remove = vi.fn(() => Promise.resolve());

    const doomed = await pruneSnapshots({ names: ['d', 'c', 'b', 'a'], keep: 2, remove });

    expect(doomed).toEqual(['b', 'a']);
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it('leaves everything where there are no more than it keeps', async () => {
    const remove = vi.fn(() => Promise.resolve());

    await pruneSnapshots({ names: ['b', 'a'], keep: 3, remove });

    expect(remove).not.toHaveBeenCalled();
  });

  it('never deletes the newest, whatever it is asked to keep', async () => {
    const remove = vi.fn(() => Promise.resolve());

    const doomed = await pruneSnapshots({ names: ['b', 'a'], keep: 0, remove });

    expect(doomed).toEqual(['a']);
  });
});
