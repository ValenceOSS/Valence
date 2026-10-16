import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addChild, fetchChildren, setChildPin } from './fetchChildren';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<JsonValue> }>;

const fetchMock = vi.fn<FetchLike>();

const ok = (body: JsonValue) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchChildren', () => {
  it('answers with the children this account looks after', async () => {
    fetchMock.mockResolvedValue(ok({ children: [{ id: 'kit', name: 'Kit', hasPin: true }] }));

    await expect(fetchChildren()).resolves.toEqual([{ id: 'kit', name: 'Kit', hasPin: true }]);
  });
});

describe('addChild', () => {
  it('sends the name and PIN, and answers with no refusal when it worked', async () => {
    fetchMock.mockResolvedValue(ok({ children: [] }));

    await expect(addChild('Kit', '1234')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/children',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Kit', pin: '1234' }),
      }),
    );
  });

  it('says what the server refused with', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'No.', code: 'x', values: {} }),
    });

    await expect(addChild('Kit', null)).resolves.toEqual({ message: 'No.' });
  });

  it('says the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(addChild('Kit', null)).resolves.not.toBeNull();
  });
});

describe('setChildPin', () => {
  it('sends the new PIN, or none, to that child', async () => {
    fetchMock.mockResolvedValue(ok({ children: [] }));

    await setChildPin('kit', null);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/children/kit/pin',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ pin: null }) }),
    );
  });
});
