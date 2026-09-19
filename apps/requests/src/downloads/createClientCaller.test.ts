import { describe, expect, it, vi } from 'vitest';
import { createClientCaller } from './createClientCaller';
import type { ClientFetch } from './DownloadClientAdapter';

describe('createClientCaller', () => {
  it('asks with what it was given, and nothing it was not', async () => {
    const fetch = vi.fn<ClientFetch>(() => Promise.resolve(new Response('ok')));

    await createClientCaller(fetch, 'qBittorrent')('http://client/a');
    await createClientCaller(fetch, 'qBittorrent')('http://client/b', {
      method: 'POST',
      headers: { a: 'b' },
      body: 'x',
    });

    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
      headers: { connection: 'close' },
    });
    expect(fetch.mock.calls[0]?.[1]).not.toHaveProperty('body');
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
      headers: { a: 'b', connection: 'close' },
      body: 'x',
    });
  });

  it('says a client could not be reached', async () => {
    const fetch = vi.fn<ClientFetch>(() => Promise.reject(new Error('ECONNREFUSED')));

    await expect(createClientCaller(fetch, 'qBittorrent')('http://client')).rejects.toThrow(
      'qBittorrent could not be reached',
    );
  });

  it('says a client did not answer in time', async () => {
    const fetch = vi.fn<ClientFetch>(() =>
      Promise.reject(Object.assign(new Error('late'), { name: 'TimeoutError' })),
    );

    await expect(createClientCaller(fetch, 'SABnzbd', 3)('http://client')).rejects.toThrow(
      'SABnzbd did not answer within 3 seconds',
    );
  });
});
