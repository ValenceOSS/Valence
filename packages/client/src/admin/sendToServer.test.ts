import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { sendToServer } from './sendToServer';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const Shape = z.object({ isDone: z.boolean() });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendToServer', () => {
  it('sends a JSON body and reads the answer through its schema', async () => {
    fetchMock.mockResolvedValue(Response.json({ isDone: true }));

    await expect(
      sendToServer('/api/thing', { method: 'POST', body: { a: 1 } }, Shape),
    ).resolves.toEqual({ kind: 'answered', value: { isDone: true } });

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe('/api/thing');
    expect(init).toMatchObject({ method: 'POST', body: '{"a":1}' });
  });

  it('passes on a refusal', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'No.' }, { status: 400 }));

    await expect(sendToServer('/api/thing', { method: 'DELETE' }, Shape)).resolves.toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });

  it('refuses an answer in a shape it does not know', async () => {
    fetchMock.mockResolvedValue(Response.json({ something: 'else' }));

    const outcome = await sendToServer('/api/thing', { method: 'GET' }, Shape);

    expect(outcome.kind).toBe('refused');
  });

  it('says the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(sendToServer('/api/thing', { method: 'GET' }, Shape)).resolves.toEqual({
      kind: 'refused',
      refusal: { message: 'The server could not be reached.' },
    });
  });
});
