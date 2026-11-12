import { describe, expect, it, vi } from 'vitest';
import { narrowEveryPicture } from './narrowEveryPicture';

describe('narrowEveryPicture', () => {
  it('narrows every picture once at every width, leaving out the missing and the repeated', async () => {
    const read = vi.fn(() => Promise.resolve({}));

    await expect(
      narrowEveryPicture({ listArtworkUrls: () => Promise.resolve(['a', null, 'b', 'a']), read }),
    ).resolves.toEqual({ made: 4, failed: 0 });

    expect(read.mock.calls).toEqual(
      expect.arrayContaining([
        ['a', 342],
        ['a', 640],
        ['b', 342],
        ['b', 640],
      ]),
    );
    expect(read).toHaveBeenCalledTimes(4);
  });

  it('counts a picture that could not be read and carries on with the rest', async () => {
    const onProblem = vi.fn();
    const read = vi.fn((url: string) =>
      url === 'gone'
        ? Promise.reject(new Error('gone'))
        : Promise.resolve(url === 'none' ? null : {}),
    );

    await expect(
      narrowEveryPicture({
        listArtworkUrls: () => Promise.resolve(['gone', 'none', 'fine']),
        read,
        onProblem,
      }),
    ).resolves.toEqual({ made: 2, failed: 4 });

    expect(onProblem).toHaveBeenCalledWith('gone');
    expect(onProblem).toHaveBeenCalledWith('none');
  });

  it('says how far it has got', async () => {
    const onProgress = vi.fn();

    await narrowEveryPicture({
      listArtworkUrls: () => Promise.resolve(['a']),
      read: () => Promise.resolve({}),
      atOnce: 1,
      onProgress,
    });

    expect(onProgress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it('has nothing to do where there are no pictures', async () => {
    const onProgress = vi.fn();

    await expect(
      narrowEveryPicture({
        listArtworkUrls: () => Promise.resolve([]),
        read: () => Promise.resolve({}),
        onProgress,
      }),
    ).resolves.toEqual({ made: 0, failed: 0 });

    expect(onProgress).not.toHaveBeenCalled();
  });

  it('stops once the job is cancelled, and waits while it is paused', async () => {
    const read = vi.fn(() => Promise.resolve({}));
    const state = { cancelled: false, waited: 0 };

    await narrowEveryPicture({
      listArtworkUrls: () => Promise.resolve(['a', 'b', 'c']),
      read: (url, width) => {
        state.cancelled = url === 'b';

        return read(url, width);
      },
      atOnce: 1,
      isCancelled: () => state.cancelled,
      untilResumed: () => {
        state.waited += 1;

        return Promise.resolve();
      },
    });

    expect(read.mock.calls.map(([url]) => url)).toEqual(['a', 'a', 'b']);
    expect(state.waited).toBe(4);
  });
});
