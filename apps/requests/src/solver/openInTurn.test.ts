import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGate } from '@ValenceRequests/solver/createGate';
import { openInTurn } from './openInTurn';

afterEach(() => {
  vi.useRealTimers();
});

describe('openInTurn', () => {
  it('opens one thing at a time', async () => {
    const opening = createGate(1);
    let open = 0;
    let most = 0;
    const tab = () => {
      open += 1;
      most = Math.max(most, open);

      return Promise.resolve({
        close: () => Promise.resolve(),
      }).finally(() => {
        open -= 1;
      });
    };

    await Promise.all([openInTurn(opening, tab), openInTurn(opening, tab)]);

    expect(most).toBe(1);
  });

  it('gives the turn up where opening takes too long, and closes what opens after', async () => {
    vi.useFakeTimers();

    const opening = createGate(1);
    const late = { close: vi.fn(() => Promise.resolve()) };
    let arrive = (): void => {};
    const stuck = openInTurn(
      opening,
      () =>
        new Promise<typeof late>((resolve) => {
          arrive = () => {
            resolve(late);
          };
        }),
      1000,
    );
    const failing = expect(stuck).rejects.toThrow('The browser did not open a tab in time');

    await vi.advanceTimersByTimeAsync(1000);
    await failing;

    const next = { close: () => Promise.resolve() };

    await expect(openInTurn(opening, () => Promise.resolve(next))).resolves.toBe(next);

    arrive();
    await vi.advanceTimersByTimeAsync(0);
    expect(late.close).toHaveBeenCalled();
  });
});
