import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { completeSetup } from './completeSetup';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const REQUEST = {
  admin: { name: 'Ada', username: 'ada', password: 'a-long-password' },
  trustedOrigins: ['http://localhost:8420'],
  cookieSecure: false,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('completeSetup', () => {
  it('posts the administrator and reads what the server did', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ isComplete: true, isSignedIn: true, restartRequired: false }),
    );

    await expect(completeSetup(REQUEST)).resolves.toEqual({
      kind: 'answered',
      value: { isComplete: true, isSignedIn: true, restartRequired: false },
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/setup');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(REQUEST));
  });

  it('reads an older answer without a sign-in as not signed in', async () => {
    fetchMock.mockResolvedValue(Response.json({ isComplete: true, restartRequired: true }));

    await expect(completeSetup(REQUEST)).resolves.toEqual({
      kind: 'answered',
      value: { isComplete: true, isSignedIn: false, restartRequired: true },
    });
  });

  it('passes on the server’s refusal', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: 'Setup is already done.' }, { status: 409 }),
    );

    await expect(completeSetup(REQUEST)).resolves.toEqual({
      kind: 'refused',
      refusal: { message: 'Setup is already done.' },
    });
  });
});
