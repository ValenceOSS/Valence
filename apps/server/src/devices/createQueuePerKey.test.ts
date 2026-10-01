import { describe, expect, it } from 'vitest';
import { createQueuePerKey } from './createQueuePerKey';

/**
 * A promise the test settles by hand, so it decides when a piece of work finishes.
 *
 * @returns The promise, and how to settle it either way.
 */
const aDeferred = () => {
  let resolve: () => void = () => undefined;
  let reject: (reason: Error) => void = () => undefined;
  const promise = new Promise<void>((settle, fail) => {
    resolve = settle;
    reject = fail;
  });

  return { promise, resolve, reject };
};

describe('createQueuePerKey', () => {
  it('starts one key’s next piece of work only once the one before it has finished', async () => {
    const queue = createQueuePerKey();
    const first = aDeferred();
    const secondDone = aDeferred();
    const started: string[] = [];

    queue('phone', () => {
      started.push('started');

      return first.promise;
    });
    queue('phone', () => {
      started.push('stopped');
      secondDone.resolve();

      return Promise.resolve();
    });
    await Promise.resolve();

    expect(started).toEqual(['started']);

    first.resolve();
    await secondDone.promise;

    expect(started).toEqual(['started', 'stopped']);
  });

  it('does not hold one key’s work up behind another’s', async () => {
    const queue = createQueuePerKey();
    const phone = aDeferred();
    const laptopDone = aDeferred();

    queue('phone', () => phone.promise);
    queue('laptop', () => {
      laptopDone.resolve();

      return Promise.resolve();
    });

    await laptopDone.promise;
    phone.resolve();
  });

  it('carries on past a piece of work that fails', async () => {
    const queue = createQueuePerKey();
    const failing = aDeferred();
    const nextDone = aDeferred();

    queue('phone', () => failing.promise);
    queue('phone', () => {
      nextDone.resolve();

      return Promise.resolve();
    });
    failing.reject(new Error('the book had gone'));

    await nextDone.promise;
  });
});
