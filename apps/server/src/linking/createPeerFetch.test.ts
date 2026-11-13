import { describe, expect, it, vi } from 'vitest';
import { createPeerFetch } from './createPeerFetch';

const answered = (status: number, headers: Record<string, string> = {}) =>
  vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status, headers })));

describe('createPeerFetch', () => {
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
});
