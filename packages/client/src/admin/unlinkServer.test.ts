import { afterEach, describe, expect, it, vi } from 'vitest';
import { unlinkServer } from './unlinkServer';

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

describe('unlinkServer', () => {
  it('unlinks a server by its id', async () => {
    const fetchMock = answering(null, 204);

    expect(await unlinkServer('a-server')).toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
