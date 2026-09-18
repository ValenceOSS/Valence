import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchOnboarding,
  finishOnboarding,
  saveHousehold,
  uploadHouseholdPhoto,
} from './fetchHousehold';

const A_HOUSEHOLD = {
  name: 'The Morgans',
  colour: '#3ac47d',
  avatar: { kind: 'initial' },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const answering = (body: string | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(
      new Response(body, { status, headers: { 'content-type': 'application/json' } }),
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

const asJson = (body: object) => JSON.stringify(body);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reading whether a household is set up', () => {
  it('reads it back through the contract rather than trusting the answer', async () => {
    answering(asJson({ isOnboarded: false, household: A_HOUSEHOLD }));

    await expect(fetchOnboarding()).resolves.toMatchObject({
      isOnboarded: false,
      household: { name: 'The Morgans' },
    });
  });
});

describe('changing a household', () => {
  it('sends only what is being changed', async () => {
    const fetchMock = answering(asJson(A_HOUSEHOLD));

    await saveHousehold({ name: 'The Morgans' });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ name: 'The Morgans' }),
    });
  });

  it('answers with nothing where the server refused', async () => {
    answering(asJson({ error: 'no' }), 400);

    await expect(saveHousehold({ name: 'x' })).resolves.toBeNull();
  });
});

describe('putting a picture on a household', () => {
  const aFile = () => new File(['bytes'], 'face.png', { type: 'image/png' });

  it('says nothing was wrong where it was kept', async () => {
    answering(null, 204);

    await expect(uploadHouseholdPhoto(aFile())).resolves.toBeNull();
  });

  it('carries back the sentence the server refused it with', async () => {
    answering(asJson({ error: 'A picture has to be 6 MB or smaller.' }), 413);

    await expect(uploadHouseholdPhoto(aFile())).resolves.toBe(
      'A picture has to be 6 MB or smaller.',
    );
  });

  it('says something useful where the server said nothing it could read', async () => {
    answering('not json at all', 500);

    await expect(uploadHouseholdPhoto(aFile())).resolves.toBe('That picture could not be used.');
  });
});

describe('finishing', () => {
  it('is a call of its own, so it cannot ride along with a change', async () => {
    const fetchMock = answering(null, 204);

    await expect(finishOnboarding()).resolves.toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/account/onboarding');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('answers false where it did not land, so nothing is recorded as done', async () => {
    answering(asJson({ error: 'no' }), 401);

    await expect(finishOnboarding()).resolves.toBe(false);
  });
});
