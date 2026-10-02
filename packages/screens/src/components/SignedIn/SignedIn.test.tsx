import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadEveryPage } from '@ValenceScreens/testing/loadEveryPage';
import { renderTheApp } from '@ValenceScreens/testing/renderTheApp';
import { signedInOnThisPage } from '@ValenceScreens/phone/signedInOnThisPage';

const fetchMock = vi.fn();

const authenticateWithPasskey = vi.hoisted(() => vi.fn());

const handBackToThePhone = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/session/auth', async (actual) => ({
  ...(await actual<object>()),
  authenticateWithPasskey,
}));

vi.mock('@ValenceScreens/passkeys/isPasskeySupported', () => ({
  isPasskeySupported: () => true,
  describePasskeyUnavailability: () => null,
}));

vi.mock('@ValenceClient/phone/handBackToThePhone', () => ({ handBackToThePhone }));

vi.mock('@ValenceClient/realtime/getRealtimeClient', () => ({
  allowRealtimeClientToStart: () => undefined,
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
  avatar: { kind: 'initial', font: 'gilroy' },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const serverWith = (
  session: object | null,
  isOnboarded = true,
  {
    isFlowOpen = false,
    isAdministrator = true,
  }: { isFlowOpen?: boolean; isAdministrator?: boolean } = {},
) => {
  fetchMock.mockImplementation((asked: string) => {
    const input = new URL(asked, 'http://localhost:3000').pathname;

    if (input === '/api/setup/status') {
      return Promise.resolve(ok({ ...SETUP, isFlowOpen }));
    }

    if (input === '/api/account/permissions') {
      return Promise.resolve(ok({ permissions: [], isAdministrator }));
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

beforeAll(loadEveryPage, 60_000);

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

  it('shows an administrator who left first-run setup the rest of it, from their profile', async () => {
    serverWith({ user: OPERATOR }, true, { isFlowOpen: true, isAdministrator: true });

    renderTheApp();

    expect(await screen.findByRole('heading', { name: 'Your profile' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Set up Valence' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Sections' })).not.toBeInTheDocument();
  });

  it('lets somebody who is not an administrator in while setup is still open', async () => {
    serverWith({ user: OPERATOR }, true, { isFlowOpen: true, isAdministrator: false });

    renderTheApp();

    expect(await screen.findByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your profile' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/account/permissions', expect.anything());
  });

  it('lets an administrator in once setup has been finished', async () => {
    serverWith({ user: OPERATOR }, true, { isFlowOpen: false, isAdministrator: true });

    renderTheApp();

    expect(await screen.findByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your profile' })).not.toBeInTheDocument();
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

  it('signs somebody in for the phone app with a passkey, and hands it straight back', async () => {
    window.history.replaceState(null, '', `/phone-sign-in?challenge=${'a'.repeat(64)}`);
    serverWith(null);
    handBackToThePhone.mockReset().mockResolvedValue(null);
    authenticateWithPasskey.mockReset().mockImplementation(() => {
      serverWith({ user: OPERATOR });

      return Promise.resolve({ kind: 'signedIn' });
    });

    renderTheApp();

    expect(await screen.findByRole('heading', { name: 'Sign in to the app' })).toBeInTheDocument();

    await waitFor(() => {
      expect(handBackToThePhone).toHaveBeenCalledWith('a'.repeat(64), null);
    });
    expect(window.location.pathname).toBe('/phone-sign-in');
  });

  it('does not keep a sign-in on the phone page for later when nothing asked for it', async () => {
    window.history.replaceState(null, '', '/phone-sign-in');
    signedInOnThisPage.forget();
    serverWith(null);
    handBackToThePhone.mockReset().mockResolvedValue(null);
    authenticateWithPasskey.mockReset().mockImplementation(() => {
      serverWith({ user: OPERATOR });

      return Promise.resolve({ kind: 'signedIn' });
    });

    renderTheApp();

    await waitFor(() => {
      expect(authenticateWithPasskey).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Sign in to the app' })).not.toBeInTheDocument();
    });
    expect(signedInOnThisPage.read()).toBe(false);
    expect(handBackToThePhone).not.toHaveBeenCalled();
  });
});
