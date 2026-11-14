import { createServer } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createPeerFetch } from './createPeerFetch';

const answered = (status: number, headers: Record<string, string> = {}) =>
  vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status, headers })));

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

describe('createPeerFetch', () => {
  it('connects to the address it checked, and hands the answer on as a stream', async () => {
    await withAServer(async (port) => {
      const peerFetch = createPeerFetch(undefined, () => Promise.resolve(['127.0.0.1']));
      const answer = await peerFetch(`http://friend.example:${port}/film`, {});

      expect(answer.status).toBe(200);
      expect(answer.body).toBeInstanceOf(ReadableStream);
      expect(await answer.text()).toBe('hello');
    });
  });

  it('does not connect to a link-local address a name is switched to after it was checked', async () => {
    await withAServer(async (port, reached) => {
      const resolve = vi
        .fn<() => Promise<string[]>>()
        .mockResolvedValueOnce(['127.0.0.1'])
        .mockResolvedValue(['169.254.169.254']);
      const peerFetch = createPeerFetch(undefined, resolve);

      await expect(peerFetch(`http://friend.example:${port}/film`, {})).rejects.toThrow(
        /169\.254\.169\.254/,
      );
      expect(reached()).toBe(0);
    });
  });

  it('asks another server, and never follows it somewhere else', async () => {
    const fetcher = answered(200);
    const peerFetch = createPeerFetch(fetcher, () => Promise.resolve(['192.168.1.20']));

    expect((await peerFetch('http://anime.lan:8420/api/federation/v1/server', {})).status).toBe(
      200,
    );
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ redirect: 'manual' });
  });

  it('treats an answer that sends it elsewhere as no answer', async () => {
    const peerFetch = createPeerFetch(answered(302, { location: 'http://169.254.169.254/' }), () =>
      Promise.resolve(['203.0.113.5']),
    );

    await expect(peerFetch('https://anime.example/api/federation/v1/server', {})).rejects.toThrow();
  });

  it('never asks a link-local address, where a cloud keeps its secrets', async () => {
    const fetcher = answered(200);
    const peerFetch = createPeerFetch(fetcher, () => Promise.resolve(['169.254.169.254']));

    await expect(peerFetch('http://169.254.169.254/latest/meta-data', {})).rejects.toThrow();
    await expect(
      peerFetch('http://metadata.example/api/federation/v1/server', {}),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('asks the name of a server once a minute, not once for every piece of a film', async () => {
    let at = 0;
    const resolve = vi.fn(() => Promise.resolve(['192.168.1.20']));
    const peerFetch = createPeerFetch(answered(200), resolve, () => at);

    await peerFetch('http://anime.lan/a', {});
    await peerFetch('http://anime.lan/b', {});
    at += 61_000;
    await peerFetch('http://anime.lan/c', {});

    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('follows one step from http to the same name over https', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: 'https://friend.example/x' } }),
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const peerFetch = createPeerFetch(fetcher, () => Promise.resolve(['203.0.113.5']));

    const answer = await peerFetch('http://friend.example/x', { method: 'POST', body: 'b' });

    expect(answer.status).toBe(200);
    expect(fetcher.mock.calls.map(([address]) => address)).toEqual([
      'http://friend.example/x',
      'https://friend.example/x',
    ]);
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', body: 'b' });
  });

  it('refuses an upgrade whose name now leads to a link-local address', async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(null, { status: 301, headers: { location: 'https://friend.example/x' } }),
      ),
    );
    const resolve = vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValueOnce(['203.0.113.5'])
      .mockResolvedValue(['169.254.169.254']);
    const peerFetch = createPeerFetch(fetcher, resolve);

    await expect(peerFetch('http://friend.example/x', {})).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refuses a second redirect, and any redirect to another name', async () => {
    const twice = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(null, { status: 301, headers: { location: 'https://friend.example/x' } }),
      ),
    );
    const elsewhere = answered(301, { location: 'https://other.example/x' });
    const resolve = () => Promise.resolve(['203.0.113.5']);

    await expect(createPeerFetch(twice, resolve)('http://friend.example/x', {})).rejects.toThrow();
    expect(twice).toHaveBeenCalledTimes(2);
    await expect(
      createPeerFetch(elsewhere, resolve)('http://friend.example/x', {}),
    ).rejects.toThrow();
    expect(elsewhere).toHaveBeenCalledTimes(1);
  });
});
