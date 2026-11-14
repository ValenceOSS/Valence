import { describe, expect, it, vi } from 'vitest';
import { pageForTest } from './pageForTest';

vi.mock('node:worker_threads', async () => {
  const { EventEmitter } = await import('node:events');

  class Worker extends EventEmitter {
    unref = (): void => {};

    terminate = (): Promise<number> => Promise.resolve(0);

    postMessage = (message: { id: number }): void => {
      if (message.id === 0) {
        setImmediate(() => {
          this.emit('message', { id: 0, started: true });
          this.emit('exit', 1);
        });
      }
    };
  }

  return { Worker };
});

const { createThreadedSearchReader } = await import('./createThreadedSearchReader');

describe('createThreadedSearchReader when a thread stops by itself', () => {
  it('answers the page it was reading with no results, and the others to be read here', async () => {
    const read = createThreadedSearchReader(1, 60_000);

    expect(await Promise.all([read(pageForTest()), read(pageForTest())])).toEqual([[], null]);
  });
});
