import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderTheApp } from '@ValenceScreens/testing/renderTheApp';

const fetchMock = vi.fn();

vi.mock('@ValenceClient/realtime/getRealtimeClient', () => ({
  getRealtimeClient: () => ({
    start: () => undefined,
    stop: () => undefined,
    subscribe: () => () => undefined,
    identify: () => undefined,
    onResumed: () => () => undefined,
    isLive: () => true,
    connectionId: () => 'me',
    sendParty: () => undefined,
    askClock: () => undefined,
    onClockTell: () => () => undefined,
    onRefused: () => () => undefined,
    onNeedsPassword: () => () => undefined,
  }),
}));

const SETUP = {
  isComplete: true,
  detectedOrigin: 'http://local.dev',
  isSecureContext: true,
  suggestedTrustedOrigins: [],
};

const OPERATOR = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Operator',
  email: 'operator@valence.test',
  emailVerified: true,
  role: 'admin',
};

const ok = (body: object | null) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const HOUSEHOLD = {
  name: 'Operator',
  colour: '#3ac47d',
  avatar: { kind: 'initial' },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const serverWith = (session: object | null, isOnboarded = true) => {
  fetchMock.mockImplementation((asked: string) => {
    const input = new URL(asked, 'http://localhost:3000').pathname;

    if (input === '/api/setup/status') {
      return Promise.resolve(ok(SETUP));
    }

    if (input === '/api/account/onboarding') {
      return Promise.resolve(ok({ isOnboarded, household: HOUSEHOLD }));
    }

    if (input.startsWith('/api/libraries')) {
      return Promise.resolve(ok([]));
    }

    if (input.startsWith('/api/profiles/everyone')) {
      return Promise.resolve(ok({ profiles: [] }));
    }

    if (input.startsWith('/api/auth/get-session')) {
      return Promise.resolve(ok(session));
    }

    return Promise.resolve(ok(session));
  });
};

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SignedIn', () => {
  it('asks who is watching when nobody is', async () => {
    serverWith(null);
    renderTheApp();

    expect(await screen.findByRole('main')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/profiles/everyone', expect.anything());
    });
  });

  it('says the server is unreachable rather than asking somebody to sign in again', async () => {
    fetchMock.mockImplementation((input: string) =>
      input === '/api/setup/status'
        ? Promise.resolve(ok(SETUP))
        : Promise.reject(new Error('offline')),
    );

    renderTheApp();

    expect(
      await screen.findByRole('heading', { name: 'Valence is not reachable' }),
    ).toBeInTheDocument();
  });

  it('draws the pages beneath it once somebody is signed in', async () => {
    serverWith({ user: OPERATOR });

    renderTheApp();

    expect(await screen.findByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
  });

  it('sets the household up before anything else when nobody has', async () => {
    serverWith({ user: OPERATOR }, false);

    renderTheApp();

    expect(
      await screen.findByRole('heading', { name: 'Set up your household' }),
    ).toBeInTheDocument();

    expect(screen.queryByRole('navigation', { name: 'Sections' })).not.toBeInTheDocument();
  });

  it('asks again after a reload, because finishing is what the server was told', async () => {
    serverWith({ user: OPERATOR }, false);

    const first = renderTheApp();

    expect(
      await screen.findByRole('heading', { name: 'Set up your household' }),
    ).toBeInTheDocument();

    first.unmount();

    renderTheApp();

    expect(
      await screen.findByRole('heading', { name: 'Set up your household' }),
    ).toBeInTheDocument();
  });

  it('lets somebody through rather than stranding them when the answer cannot be had', async () => {
    fetchMock.mockImplementation((asked: string) => {
      const input = new URL(asked, 'http://localhost:3000').pathname;

      if (input === '/api/setup/status') {
        return Promise.resolve(ok(SETUP));
      }

      if (input === '/api/account/onboarding') {
        return Promise.reject(new Error('offline'));
      }

      if (input.startsWith('/api/libraries')) {
        return Promise.resolve(ok([]));
      }

      return Promise.resolve(ok({ user: OPERATOR }));
    });

    renderTheApp();

    expect(await screen.findByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
  });
});
