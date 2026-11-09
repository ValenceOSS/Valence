import { describe, expect, it, vi } from 'vitest';
import { untilReachable } from './untilReachable';

describe('untilReachable', () => {
  it('waits until the media service answers', async () => {
    const answers = [false, false, true];
    const isReachable = vi.fn(() => Promise.resolve(answers.shift() ?? true));

    expect(await untilReachable(isReachable, 10_000, () => Promise.resolve())).toBe(true);
    expect(isReachable).toHaveBeenCalledTimes(3);
  });

  it('gives up after a while, and says so', async () => {
    expect(
      await untilReachable(
        () => Promise.resolve(false),
        1_000,
        () => Promise.resolve(),
      ),
    ).toBe(false);
  });
});
