import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerLinkedServer } from './answerLinkedServer';

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

const SERVER = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  colour: '#e8503a',
  address: 'https://films.example',
  fingerprint: 'ef01',
  state: 'awaitingThem',
  createdAt: '2026-10-02T12:00:00.000Z',
  linkedAt: null,
  lastSeenAt: null,
};

describe('answerLinkedServer', () => {
  it('approves a server by its id', async () => {
    const fetchMock = answering({ ...SERVER, state: 'linked' });

    expect((await answerLinkedServer(SERVER.id, 'approve')).value?.state).toBe('linked');
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/linked-servers/${SERVER.id}/approve`);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });
});
