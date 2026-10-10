import { describe, expect, it } from 'vitest';
import { createTurns } from './createTurns';

/**
 * A piece of work that is done only when told to be.
 */
const aHeldPiece = () => {
  const done: { finish: () => void } = { finish: () => undefined };
  const finished = new Promise<void>((resolve) => {
    done.finish = resolve;
  });

  return { done, finished };
};

describe('createTurns', () => {
  it('does the work for one key in the order it was asked for, each once the last is done', async () => {
    const inTurn = createTurns();
    const order: string[] = [];
    const first = aHeldPiece();

    const firstRun = inTurn('a', async () => {
      order.push('first began');
      await first.finished;
      order.push('first ended');
    });
    const secondRun = inTurn('a', () => {
      order.push('second began');

      return Promise.resolve();
    });

    await Promise.resolve();
    first.done.finish();
    await Promise.all([firstRun, secondRun]);

    expect(order).toEqual(['first began', 'first ended', 'second began']);
  });

  it('does the work for another key without waiting', async () => {
    const inTurn = createTurns();
    const held = aHeldPiece();

    const waiting = inTurn('a', () => held.finished);

    expect(await inTurn('b', () => Promise.resolve('done'))).toBe('done');

    held.done.finish();
    await waiting;
  });

  it('goes on to the next piece when one fails, and answers each with its own outcome', async () => {
    const inTurn = createTurns();

    const failed = inTurn('a', () => Promise.reject(new Error('No')));
    const next = inTurn('a', () => Promise.resolve(2));

    await expect(failed).rejects.toThrow('No');
    expect(await next).toBe(2);
  });
});
