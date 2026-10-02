import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { sendToLinking } from './sendToLinking';

const answering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(
      body === null ? new Response(null, { status }) : Response.json(body, { status }),
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendToLinking', () => {
  it('sends under the linked servers routes, and reads the answer with the schema', async () => {
    const fetchMock = answering({ name: 'Anime' });

    expect(await sendToLinking('/identity', 'PATCH', z.object({ name: z.string() }), {})).toEqual({
      value: { name: 'Anime' },
      refusal: null,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/linked-servers/identity');
  });

  it('reads nothing where the server answered nothing', async () => {
    answering(null, 204);

    expect(await sendToLinking('/x', 'DELETE', z.null())).toEqual({ value: null, refusal: null });
  });

  it('passes on why the server refused', async () => {
    answering({ error: 'That invite has been used.', code: 'error.linking.x', values: {} }, 400);

    expect(await sendToLinking('', 'POST', z.null(), { invite: 'x' })).toEqual({
      value: null,
      refusal: { message: 'That invite has been used.' },
    });
  });

  it('says so when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<() => Promise<Response>>(() => Promise.reject(new Error('offline'))),
    );

    expect((await sendToLinking('', 'POST', z.null())).refusal).not.toBeNull();
  });
});
