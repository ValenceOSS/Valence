import { describe, expect, it } from 'vitest';
import { createQueuePerKey } from './createQueuePerKey';

const after = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('createQueuePerKey', () => {
  it('finishes one key’s work in the order it was given, however long each piece takes', async () => {
    const queue = createQueuePerKey();
    const done: string[] = [];

    queue('phone', async () => {
      await after(20);
      done.push('started');
    });
    queue('phone', async () => {
      await after(1);
      done.push('stopped');
    });
    await after(40);

    expect(done).toEqual(['started', 'stopped']);
  });

  it('does not hold one key’s work up behind another’s', async () => {
    const queue = createQueuePerKey();
    const done: string[] = [];

    queue('phone', async () => {
      await after(20);
      done.push('phone');
    });
    queue('laptop', async () => {
      await after(1);
      done.push('laptop');
    });
    await after(40);

    expect(done).toEqual(['laptop', 'phone']);
  });

  it('carries on past a piece of work that fails', async () => {
    const queue = createQueuePerKey();
    const done: string[] = [];

    queue('phone', () => Promise.reject(new Error('the book had gone')));
    queue('phone', () => {
      done.push('stopped');

      return Promise.resolve();
    });
    await after(5);

    expect(done).toEqual(['stopped']);
  });
});
