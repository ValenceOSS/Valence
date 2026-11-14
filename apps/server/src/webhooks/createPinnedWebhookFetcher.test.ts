import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { say } from '@ValenceI18n/say';
import { createPinnedWebhookFetcher } from './createPinnedWebhookFetcher';

const LOCAL_NETWORK = say('error.webhook.valenceWillNotSendToTheLocalNetwork');
const NEVER = say('error.common.valenceWillNotSendDeliveriesTo');

const initFor = () => ({
  method: 'POST',
  headers: {},
  body: '{}',
  signal: AbortSignal.timeout(5000),
});

/**
 * Runs a test against a server on this machine that counts the connections made to it.
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

describe('createPinnedWebhookFetcher', () => {
  it('refuses a private address written out, before connecting', async () => {
    await withAServer(async (port, reached) => {
      await expect(
        createPinnedWebhookFetcher(false)(`http://127.0.0.1:${port}/x`, initFor()),
      ).rejects.toThrow(LOCAL_NETWORK);
      await expect(
        createPinnedWebhookFetcher(false)(`http://[::1]:${port}/x`, initFor()),
      ).rejects.toThrow(LOCAL_NETWORK);
      expect(reached()).toBe(0);
    });
  });

  it('refuses a link-local address written out even with the local network allowed', async () => {
    await expect(
      createPinnedWebhookFetcher(true)('http://169.254.169.254/latest/meta-data/', initFor()),
    ).rejects.toThrow(NEVER);
  });

  it('refuses a name that resolves to a private address, naming the Local network switch', async () => {
    await withAServer(async (port, reached) => {
      const fetcher = createPinnedWebhookFetcher(false, () => Promise.resolve(['127.0.0.1']));

      await expect(fetcher(`http://hooks.example.test:${port}/x`, initFor())).rejects.toThrow(
        LOCAL_NETWORK,
      );
      expect(reached()).toBe(0);
    });
  });

  it('refuses a name that resolves to the cloud metadata address, switch or no switch', async () => {
    const fetcher = createPinnedWebhookFetcher(true, () => Promise.resolve(['169.254.169.254']));

    await expect(fetcher('http://hooks.example.test:8089/x', initFor())).rejects.toThrow(NEVER);
  });

  it('connects to a name that resolves to a private address once the local network is allowed', async () => {
    await withAServer(async (port, reached) => {
      const fetcher = createPinnedWebhookFetcher(true, () => Promise.resolve(['127.0.0.1']));

      await expect(
        fetcher(`http://hooks.example.test:${port}/x`, initFor()),
      ).resolves.toStrictEqual({ ok: true, status: 200 });
      expect(reached()).toBe(1);
    });
  });
});
