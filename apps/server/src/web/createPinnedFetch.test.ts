import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createPinnedFetch } from './createPinnedFetch';

/**
 * Runs a test against a server on this machine that answers every request with a few words.
 *
 * @param test - The test, given the port and how many requests have come in.
 */
const withAServer = async (test: (port: number, reached: () => number) => Promise<void>) => {
  let reached = 0;
  const server = createServer((_request, response) => {
    reached += 1;
    response.end('hello');
  });

  await new Promise<void>((done) => {
    server.listen(0, '127.0.0.1', done);
  });

  try {
    const address = server.address();

    await test(typeof address === 'object' && address !== null ? address.port : 0, () => reached);
  } finally {
    server.close();
  }
};

describe('createPinnedFetch', () => {
  it('connects to an address that is allowed and hands back its answer', async () => {
    await withAServer(async (port) => {
      const pinned = createPinnedFetch(
        (address) => address === '127.0.0.1',
        () => new Error('no'),
      );
      const answer = await pinned(`http://localhost:${port}/x`);

      expect(answer.status).toBe(200);
      expect(await answer.text()).toBe('hello');
    });
  });

  it('refuses a name that resolves to an address that is not allowed, without connecting', async () => {
    await withAServer(async (port, reached) => {
      const pinned = createPinnedFetch(
        () => false,
        () => new Error('no'),
      );

      await expect(pinned(`http://localhost:${port}/x`)).rejects.toThrow();
      expect(reached()).toBe(0);
    });
  });

  it('refuses an address written as a number that is not allowed', async () => {
    await withAServer(async (port, reached) => {
      const pinned = createPinnedFetch(
        () => false,
        (addresses) => new Error(addresses.join(',')),
      );

      await expect(pinned(`http://127.0.0.1:${port}/x`)).rejects.toThrow('127.0.0.1');
      expect(reached()).toBe(0);
    });
  });
});
