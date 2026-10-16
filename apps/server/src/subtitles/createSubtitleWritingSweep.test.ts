import { describe, expect, it, vi } from 'vitest';
import { createSubtitleWritingSweep } from './createSubtitleWritingSweep';

const aSweep = (overrides: Partial<Parameters<typeof createSubtitleWritingSweep>[0]> = {}) => {
  const write = vi.fn(() => Promise.resolve(true));
  const sweep = createSubtitleWritingSweep({
    newest: () => Promise.resolve(['a', 'b', 'c']),
    isOn: () => Promise.resolve(true),
    hasOwnSubtitles: (mediaId) => Promise.resolve(mediaId === 'b'),
    write,
    ...overrides,
  });

  return { sweep, write };
};

describe('createSubtitleWritingSweep', () => {
  it('does nothing while writing is off', async () => {
    const { sweep, write } = aSweep({ isOn: () => Promise.resolve(false) });

    await expect(sweep.run(vi.fn())).resolves.toBe(0);
    expect(write).not.toHaveBeenCalled();
  });

  it('starts writing for each newest title with no subtitles of its own', async () => {
    const { sweep, write } = aSweep();

    await expect(sweep.run(vi.fn())).resolves.toBe(2);
    expect(write.mock.calls).toEqual([['a'], ['c']]);
  });

  it('does not count a title already written', async () => {
    const { sweep } = aSweep({ write: (mediaId) => Promise.resolve(mediaId !== 'a') });

    await expect(sweep.run(vi.fn())).resolves.toBe(1);
  });

  it('stops after twenty a round, so a library is covered over a few nights', async () => {
    const { sweep, write } = aSweep({
      newest: () => Promise.resolve(Array.from({ length: 50 }, (_, at) => `t${String(at)}`)),
      hasOwnSubtitles: () => Promise.resolve(false),
    });

    await expect(sweep.run(vi.fn())).resolves.toBe(20);
    expect(write).toHaveBeenCalledTimes(20);
  });
});
