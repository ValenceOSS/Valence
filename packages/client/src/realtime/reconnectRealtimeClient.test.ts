import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Handlers, RealtimeClient } from './createRealtimeClient';

const links: Handlers[] = [];

let closed = 0;

/**
 * Starts a run with nothing remembered, since the client is held in a module and one test's
 * connection would otherwise be the next one's.
 */
const startAfresh = async (): Promise<{
  getRealtimeClient: () => RealtimeClient;
  reconnectRealtimeClient: () => void;
}> => {
  vi.resetModules();

  links.length = 0;
  closed = 0;

  const { installPlatform } = await import('@ValenceClient/platform/installPlatform');
  const { aFakePlatform } = await import('@ValenceClient/testing/aFakePlatform');

  installPlatform({
    ...aFakePlatform(),
    openSocket: (handlers) => {
      links.push(handlers);

      return {
        send: () => {},
        close: () => {
          closed += 1;
        },
      };
    },
  });

  const { getRealtimeClient } = await import('./getRealtimeClient');
  const { reconnectRealtimeClient } = await import('./reconnectRealtimeClient');

  return { getRealtimeClient, reconnectRealtimeClient };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('reconnectRealtimeClient', () => {
  it('closes the connection held and opens another', async () => {
    const { getRealtimeClient, reconnectRealtimeClient } = await startAfresh();

    getRealtimeClient();
    reconnectRealtimeClient();

    expect(links).toHaveLength(2);
    expect(closed).toBe(1);
  });

  it('keeps the one client, so everything listening on it hears the new connection', async () => {
    const { getRealtimeClient, reconnectRealtimeClient } = await startAfresh();

    const client = getRealtimeClient();

    links[0]?.onOpen();
    reconnectRealtimeClient();

    expect(getRealtimeClient()).toBe(client);
    expect(client.isLive()).toBe(false);

    links[1]?.onOpen();

    expect(client.isLive()).toBe(true);
  });

  it('leaves one connection open where none was held yet', async () => {
    const { reconnectRealtimeClient } = await startAfresh();

    reconnectRealtimeClient();

    expect(links.length - closed).toBe(1);
  });
});
