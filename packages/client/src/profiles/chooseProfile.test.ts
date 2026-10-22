import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { chooseProfile } from './chooseProfile';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Kid',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: false,
  hasPin: true,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const COULD_NOT = 'Couldn’t do that. Try again in a moment.';

const refuseWith = (status: number, body: { error: string; needs?: 'pin' | 'newPin' }) => {
  fetchMock.mockResolvedValue(Response.json(body, { status }));
};

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(Response.json(PROFILE));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseProfile', () => {
  it('chooses the profile, sending nothing where nothing was given', async () => {
    await expect(chooseProfile(PROFILE.id)).resolves.toEqual({ kind: 'chosen', profile: PROFILE });
    expect(fetchMock).toHaveBeenCalledWith(`/api/profiles/${PROFILE.id}/choose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
  });

  it('sends the PIN, a new PIN or the password it was given', async () => {
    await chooseProfile('kid', { pin: '1234' });
    await chooseProfile('kid', { password: 'secret', newPin: '4321' });

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe('{"pin":"1234"}');
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe('{"password":"secret","newPin":"4321"}');
  });

  it('keeps a profile’s id from reaching past its own place in the address', async () => {
    await chooseProfile('a/b');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/profiles/a%2Fb/choose');
  });

  it('refuses where the chosen profile does not come back as one', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 'not a profile' }));

    await expect(chooseProfile('kid')).resolves.toEqual({ kind: 'refused', reason: COULD_NOT });
  });

  it('asks for the PIN without calling it wrong where none was given yet', async () => {
    refuseWith(403, { error: 'That PIN isn’t right.', needs: 'pin' });

    await expect(chooseProfile('kid')).resolves.toEqual({ kind: 'needsPin', reason: null });
  });

  it('asks for the PIN again, saying why, where a wrong one was given', async () => {
    refuseWith(403, { error: 'That PIN isn’t right.', needs: 'pin' });

    await expect(chooseProfile('kid', { pin: '0000' })).resolves.toEqual({
      kind: 'needsPin',
      reason: 'That PIN isn’t right.',
    });
  });

  it('asks for the PIN again, saying why, where a wrong password was given', async () => {
    refuseWith(403, { error: 'That password isn’t right.', needs: 'pin' });

    await expect(chooseProfile('kid', { password: 'wrong', newPin: '1234' })).resolves.toEqual({
      kind: 'needsPin',
      reason: 'That password isn’t right.',
    });
  });

  it('asks the owner to choose a new PIN, saying why', async () => {
    refuseWith(403, { error: 'Choose a PIN for this profile.', needs: 'newPin' });

    await expect(chooseProfile('kid')).resolves.toEqual({
      kind: 'needsNewPin',
      reason: 'Choose a PIN for this profile.',
    });
  });

  it('asks somebody to wait where they tried too often, whatever else the server needs', async () => {
    refuseWith(429, { error: 'Too many tries. Wait a minute.', needs: 'pin' });

    await expect(chooseProfile('kid', { pin: '0000' })).resolves.toEqual({
      kind: 'waiting',
      reason: 'Too many tries. Wait a minute.',
    });
  });

  it('asks somebody to wait where the server gives no reason', async () => {
    fetchMock.mockResolvedValue(new Response('slow down', { status: 429 }));

    await expect(chooseProfile('kid')).resolves.toEqual({ kind: 'waiting', reason: COULD_NOT });
  });

  it('refuses in the server’s own words where it needs nothing more', async () => {
    refuseWith(404, { error: 'There is no such profile.' });

    await expect(chooseProfile('kid')).resolves.toEqual({
      kind: 'refused',
      reason: 'There is no such profile.',
    });
  });

  it('refuses where the refusal gives no reason', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }));

    await expect(chooseProfile('kid')).resolves.toEqual({ kind: 'refused', reason: COULD_NOT });
  });

  it('refuses where the server cannot be reached, rather than throwing', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(chooseProfile('kid')).resolves.toEqual({
      kind: 'refused',
      reason: 'Couldn’t reach the Valence server.',
    });
  });
});
