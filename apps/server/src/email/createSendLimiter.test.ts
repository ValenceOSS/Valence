import { describe, expect, it } from 'vitest';
import { createSendLimiter } from './createSendLimiter';

describe('createSendLimiter', () => {
  it('lets as many through a second as allowed, and holds the next until the window moves', async () => {
    let at = 0;
    const waits: number[] = [];
    const waitTurn = createSendLimiter(
      2,
      () => at,
      (ms) => {
        waits.push(ms);
        at += ms;

        return Promise.resolve();
      },
    );

    await waitTurn();
    at = 100;
    await waitTurn();
    at = 200;
    await waitTurn();

    expect(waits).toEqual([800]);
    expect(at).toBe(1000);
  });

  it('takes turns in the order asked', async () => {
    let at = 0;
    const order: number[] = [];
    const waitTurn = createSendLimiter(
      1,
      () => at,
      (ms) => {
        at += ms;

        return Promise.resolve();
      },
    );

    await Promise.all(
      [1, 2, 3].map(async (one) => {
        await waitTurn();
        order.push(one);
      }),
    );

    expect(order).toEqual([1, 2, 3]);
    expect(at).toBe(2000);
  });
});
