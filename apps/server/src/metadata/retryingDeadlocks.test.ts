import { describe, expect, it, vi } from 'vitest';
import { retryingDeadlocks } from './retryingDeadlocks';

vi.mock('@ValenceDatabase/isDeadlock', () => ({
  isDeadlock: (error: { errno?: number }) => error.errno === 1213,
}));

describe('retryingDeadlocks', () => {
  it('writes again after a deadlock', async () => {
    const write = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ errno: 1213 })
      .mockResolvedValueOnce('written');

    await expect(retryingDeadlocks(write)).resolves.toBe('written');
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('gives up after a few deadlocks, and at once on anything else', async () => {
    const deadlocked = vi.fn<() => Promise<string>>().mockRejectedValue({ errno: 1213 });
    const broken = vi.fn<() => Promise<string>>().mockRejectedValue({ errno: 1 });

    await expect(retryingDeadlocks(deadlocked)).rejects.toEqual({ errno: 1213 });
    expect(deadlocked).toHaveBeenCalledTimes(3);
    await expect(retryingDeadlocks(broken)).rejects.toEqual({ errno: 1 });
    expect(broken).toHaveBeenCalledTimes(1);
  });
});
