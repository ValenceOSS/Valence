import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aSecureServer } from '@ValenceServer/testing/aSecureServer';
import { createPinnedFetch } from './createPinnedFetch';

const LONG_ANSWER_BYTES = 8 * 1024 * 1024;

const PACKED = gzipSync('hello, unpacked');

/**
 * Runs a test against a server on this machine that answers `/long` with eight megabytes,
 * `/packed` with a few words gzipped, `/packed-oddly` with the same under a coding list ending in
 * an empty coding, `/unchanged` with a 304, and every other request with a few words.
 *
 * @param test - The test, given the port, how many requests have come in and how many
 *   connections were opened.
 */
const withAServer = async (
  test: (port: number, reached: () => number, connected: () => number) => Promise<void>,
) => {
  let reached = 0;
  let connected = 0;
  const server = createServer((request, response) => {
    reached += 1;

    if (request.url === '/long') {
      response.end(Buffer.alloc(LONG_ANSWER_BYTES, 7));

      return;
    }

    if (request.url === '/packed' || request.url === '/packed-oddly') {
      response.writeHead(200, {
        'content-encoding': request.url === '/packed' ? 'gzip' : 'gzip,',
        'content-length': String(PACKED.byteLength),
      });
      response.end(PACKED);

      return;
    }

    if (request.url === '/unchanged') {
      response.writeHead(304, { 'content-encoding': 'gzip', 'content-length': '123' });
      response.end();

      return;
    }

    response.end('hello');
  });

  server.on('connection', () => {
    connected += 1;
  });

  await new Promise<void>((done) => {
    server.listen(0, '127.0.0.1', done);
  });

  try {
    const address = server.address();

    await test(
      typeof address === 'object' && address !== null ? address.port : 0,
      () => reached,
      () => connected,
    );
  } finally {
    server.closeAllConnections();
    server.close();
  }
};

describe('createPinnedFetch', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
        (addresses) => new Error(`refused ${addresses.join(',')}`),
      );

      await expect(pinned(`http://localhost:${port}/x`)).rejects.toThrow('refused');
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

  it('asks again over the connection it already has', async () => {
    await withAServer(async (port, reached, connected) => {
      const pinned = createPinnedFetch(
        (address) => address === '127.0.0.1',
        () => new Error('no'),
      );

      for (const _ of [1, 2, 3]) {
        const answer = await pinned(`http://127.0.0.1:${port}/x`);

        expect(await answer.text()).toBe('hello');
        await new Promise((settled) => {
          setTimeout(settled, 20);
        });
      }

      expect(reached()).toBe(3);
      expect(connected()).toBe(1);
    });
  });

  it('hands back a long answer whole', async () => {
    await withAServer(async (port) => {
      const pinned = createPinnedFetch(
        (address) => address === '127.0.0.1',
        () => new Error('no'),
      );
      const answer = await pinned(`http://127.0.0.1:${port}/long`);

      expect((await answer.arrayBuffer()).byteLength).toBe(LONG_ANSWER_BYTES);
    });
  });

  it('refuses a name whose address is not allowed through a fetch already holding a connection', async () => {
    await withAServer(async (port, reached) => {
      const pinned = createPinnedFetch(
        (address) => address === '127.0.0.1',
        (addresses) => new Error(`refused ${addresses.join(',')}`),
        (name) => Promise.resolve(name === 'allowed.test' ? ['127.0.0.1'] : ['10.0.0.1']),
      );

      expect(await (await pinned(`http://allowed.test:${port}/x`)).text()).toBe('hello');
      await expect(pinned(`http://refused.test:${port}/x`)).rejects.toThrow('refused 10.0.0.1');
      expect(reached()).toBe(1);
    });
  });

  it('speaks HTTP/1.1 to a server that offers HTTP/2', async () => {
    vi.stubEnv('NODE_TLS_REJECT_UNAUTHORIZED', '0');

    await aSecureServer(
      (request, response) => {
        response.end(request.httpVersion);
      },
      async (port) => {
        const pinned = createPinnedFetch(
          (address) => address === '127.0.0.1',
          () => new Error('no'),
        );

        expect(await (await pinned(`https://127.0.0.1:${port}/x`)).text()).toBe('1.1');
      },
    );
  });

  it('hands on a body it unpacked without the coding and length of the packed one', async () => {
    await withAServer(async (port) => {
      const pinned = createPinnedFetch(
        (address) => address === '127.0.0.1',
        () => new Error('no'),
      );
      const answer = await pinned(`http://127.0.0.1:${port}/packed`);

      expect(answer.headers.get('content-encoding')).toBeNull();
      expect(answer.headers.get('content-length')).toBeNull();
      expect(await answer.text()).toBe('hello, unpacked');
    });
  });

  it('keeps the coding and length of answers it has not unpacked', async () => {
    await withAServer(async (port) => {
      const pinned = createPinnedFetch(
        (address) => address === '127.0.0.1',
        () => new Error('no'),
      );
      const headed = await pinned(`http://127.0.0.1:${port}/packed`, { method: 'HEAD' });
      const unchanged = await pinned(`http://127.0.0.1:${port}/unchanged`);
      const oddly = await pinned(`http://127.0.0.1:${port}/packed-oddly`);

      expect(headed.headers.get('content-encoding')).toBe('gzip');
      expect(headed.headers.get('content-length')).toBe(String(PACKED.byteLength));
      expect(unchanged.status).toBe(304);
      expect(unchanged.headers.get('content-encoding')).toBe('gzip');
      expect(unchanged.headers.get('content-length')).toBe('123');
      expect(oddly.headers.get('content-encoding')).toBe('gzip,');
      expect(oddly.headers.get('content-length')).toBe(String(PACKED.byteLength));
      expect(Buffer.from(await oddly.arrayBuffer()).equals(PACKED)).toBe(true);
    });
  });
});
