import { afterEach, describe, expect, it, vi } from 'vitest';
import { withdrawLinkInvite } from './withdrawLinkInvite';

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

describe('withdrawLinkInvite', () => {
  it('withdraws an invite by its id', async () => {
    const fetchMock = answering(null, 204);

    expect(await withdrawLinkInvite('an-invite')).toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/linked-servers/invites/an-invite');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
