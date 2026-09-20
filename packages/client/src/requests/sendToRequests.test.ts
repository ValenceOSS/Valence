import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendToRequests } from './sendToRequests';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendToRequests', () => {
  it('sends a body as JSON, and reads the answer', async () => {
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(Response.json({ ok: true })),
    );

    vi.stubGlobal('fetch', fetchMock);

    expect(
      await sendToRequests('/api/x', 'POST', { a: 1 }, async (response) => response.json()),
    ).toEqual({ value: { ok: true }, refusal: null });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: '{"a":1}',
    });
  });

  it('sends nothing where there is nothing to send', async () => {
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );

    vi.stubGlobal('fetch', fetchMock);

    await sendToRequests('/api/x', 'DELETE', undefined, () => Promise.resolve(null));

    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty('body');
  });

  it('says why it was refused, or that the server could not be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ error: 'No.' }, { status: 400 })));

    expect(await sendToRequests('/api/x', 'GET', undefined, () => Promise.resolve(1))).toEqual({
      value: null,
      refusal: { message: 'No.' },
    });

    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));

    expect(await sendToRequests('/api/x', 'GET', undefined, () => Promise.resolve(1))).toEqual({
      value: null,
      refusal: { message: 'The server could not be reached.' },
    });
  });
});
