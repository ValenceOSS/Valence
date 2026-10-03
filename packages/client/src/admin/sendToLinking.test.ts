import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { z } from 'zod';
import { sendToLinking } from './sendToLinking';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendToLinking', () => {
  it('sends under the linked servers routes, and reads the answer with the schema', async () => {
    const asked = aServerAnswering({ name: 'Anime' });

    expect(await sendToLinking('/identity', 'PATCH', z.object({ name: z.string() }), {})).toEqual({
      value: { name: 'Anime' },
      refusal: null,
    });
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/identity');
  });

  it('reads nothing where the server answered nothing', async () => {
    aServerAnswering(null, 204);

    expect(await sendToLinking('/x', 'DELETE', z.null())).toEqual({ value: null, refusal: null });
  });

  it('passes on why the server refused', async () => {
    aServerAnswering(
      { error: 'That invite has been used.', code: 'error.linking.x', values: {} },
      400,
    );

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
