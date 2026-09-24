import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changeOnServer } from './changeOnServer';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ path: '/a' }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changeOnServer', () => {
  it('sends JSON where there is some, and hands back the answer', async () => {
    await expect(
      changeOnServer('/api/thing', { method: 'POST', json: { name: 'x' } }, 'No.'),
    ).resolves.toEqual({ path: '/a' });
    expect(fetchMock).toHaveBeenCalledWith('/api/thing', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: '{"name":"x"}',
    });
  });

  it('sends no body where there is none, and hands back nothing for an empty answer', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) });

    await expect(changeOnServer('/api/thing', { method: 'DELETE' }, 'No.')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/thing', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  });

  it('throws with the server’s words, or the fallback where it gave none', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'That disk is read-only to Valence.' }),
    });

    await expect(changeOnServer('/api/thing', { method: 'DELETE' }, 'No.')).rejects.toThrow(
      'That disk is read-only to Valence.',
    );

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(changeOnServer('/api/thing', { method: 'DELETE' }, 'No.')).rejects.toThrow('No.');
  });
});
