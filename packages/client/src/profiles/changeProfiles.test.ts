import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changeProfiles } from './changeProfiles';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changeProfiles', () => {
  it('sends the change to the account’s own profiles, as json', async () => {
    await changeProfiles({ path: '/kid/pin', method: 'PUT', body: { pin: '1234' } });

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/kid/pin', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{"pin":"1234"}',
    });
  });

  it('sends nothing but how to ask where there is nothing to send', async () => {
    await changeProfiles({ path: '/kid', method: 'DELETE' });

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/kid', { method: 'DELETE' });
  });

  it('sends a change to another account’s profiles to the admin area', async () => {
    await changeProfiles({ path: '/kid', method: 'PATCH', body: {}, accountId: 'acc-1' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/accounts/acc-1/profiles/kid');
  });

  it('says nothing where the change was made', async () => {
    await expect(changeProfiles({ path: '/kid', method: 'DELETE' })).resolves.toBeNull();
  });

  it('says why the server refused, in its own words', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: 'The owner can’t be removed.' }, { status: 409 }),
    );

    await expect(changeProfiles({ path: '/kid', method: 'DELETE' })).resolves.toBe(
      'The owner can’t be removed.',
    );
  });

  it('says the change could not be made where the refusal gives no reason', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }));

    await expect(changeProfiles({ path: '/kid', method: 'DELETE' })).resolves.toBe(
      'Couldn’t do that. Try again in a moment.',
    );
  });

  it('says the server could not be reached, rather than throwing', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(changeProfiles({ path: '/kid', method: 'DELETE' })).resolves.toBe(
      'Couldn’t reach the Valence server.',
    );
  });
});
