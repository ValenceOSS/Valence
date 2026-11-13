import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { describe, expect, it, vi } from 'vitest';
import { PinnedRequestRefusal } from '@ValenceCore/network/PinnedRequestRefusal';
import type { PinnedAnswer } from '@ValenceCore/network/openPinnedRequest';
import { createGuardedFetch } from '@ValenceRequests/network/createGuardedFetch';

const answerOf = (status: number, headers: Record<string, string>, url: string): PinnedAnswer => {
  const body = new IncomingMessage(new Socket());

  body.push('opened');
  body.push(null);

  return { status, headers, url: new URL(url), body };
};

const plain = () => vi.fn(() => Promise.resolve(new Response('configured', { status: 200 })));

describe('createGuardedFetch', () => {
  it('reaches a configured host as it is, even on a private address', async () => {
    const reach = plain();
    const open = vi.fn();
    const guarded = createGuardedFetch({ fetch: reach, open })(['jackett.lan:9117']);

    const response = await guarded('http://jackett.lan:9117/dl/1', {});

    expect(await response.text()).toBe('configured');
    expect(open).not.toHaveBeenCalled();
    expect(reach).toHaveBeenCalledTimes(1);
  });

  it('sends any other host through the pinned request, and refuses what it refuses', async () => {
    const reach = plain();
    const open = vi.fn(() =>
      Promise.reject(new PinnedRequestRefusal('resolvesPrivately', '169.254.169.254')),
    );
    const guarded = createGuardedFetch({ fetch: reach, open })(['jackett.lan:9117']);

    await expect(guarded('http://169.254.169.254/latest/meta-data/', {})).rejects.toBeInstanceOf(
      PinnedRequestRefusal,
    );
    expect(reach).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('does not follow a redirect from a configured host to a private one', async () => {
    const reach = vi.fn(() =>
      Promise.resolve(
        new Response(null, { status: 302, headers: { location: 'http://10.0.0.5/x' } }),
      ),
    );
    const open = vi.fn(() => Promise.reject(new PinnedRequestRefusal('notHttps', '10.0.0.5')));
    const guarded = createGuardedFetch({ fetch: reach, open })(['jackett.lan:9117']);

    await expect(guarded('http://jackett.lan:9117/dl/1', {})).rejects.toBeInstanceOf(
      PinnedRequestRefusal,
    );
    expect(open).toHaveBeenCalledWith('http://10.0.0.5/x', expect.anything(), undefined);
  });

  it('hands a redirect back where asked to, without following it', async () => {
    const open = vi.fn(() =>
      Promise.resolve(answerOf(302, { location: 'https://b.example/y' }, 'https://a.example/x')),
    );
    const guarded = createGuardedFetch({ fetch: plain(), open })([]);

    const response = await guarded('https://a.example/x', { redirect: 'manual' });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://b.example/y');
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('reads the body and the final address of a pinned answer', async () => {
    const open = vi.fn(() => Promise.resolve(answerOf(200, {}, 'https://a.example/x')));
    const guarded = createGuardedFetch({ fetch: plain(), open })([]);

    const response = await guarded('https://a.example/x', {});

    expect(await response.text()).toBe('opened');
    expect(response.url).toBe('https://a.example/x');
  });
});
