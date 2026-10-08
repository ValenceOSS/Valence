import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { TEST_ORIGIN, makeAdministrator, signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import type { SetupLinkService } from '@ValenceServer/accounts/setupLinks/SetupLinkService';
import type { EmailService } from '@ValenceServer/email/EmailService';
import { NO_EMAIL } from '@ValenceServer/email/NO_EMAIL';

const TOKEN = 'a'.repeat(43);

const PASSWORD = 'a-long-enough-password';

const EXPIRES = new Date(Date.UTC(2026, 9, 9));

/**
 * The application over a memory authentication layer, with the setup links and the email it
 * hands them to standing in.
 *
 * @returns The application and what stands in.
 */
const build = async () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const setupLinks = {
    issue: vi.fn<SetupLinkService['issue']>(),
    linkFor: vi.fn<SetupLinkService['linkFor']>(),
    stateOf: vi.fn<SetupLinkService['stateOf']>(),
    statesOf: vi.fn<SetupLinkService['statesOf']>(),
    revoke: vi.fn<SetupLinkService['revoke']>(),
    inspect: vi.fn<SetupLinkService['inspect']>(),
    redeem: vi.fn<SetupLinkService['redeem']>(),
  } satisfies SetupLinkService;
  const email = {
    ...NO_EMAIL,
    isOn: vi.fn<EmailService['isOn']>().mockResolvedValue(true),
    sendSetupLink: vi.fn<EmailService['sendSetupLink']>().mockResolvedValue({ kind: 'sent' }),
  } satisfies EmailService;
  const { user: made } = await auth.api.createUser({
    body: {
      name: 'Ada',
      email: 'ada@no-email.invalid',
      data: { username: 'ada', displayUsername: 'ada' },
    },
  });
  const users = [
    {
      id: made.id,
      name: 'Ada',
      email: 'ada@no-email.invalid',
      username: 'ada',
      role: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'sam',
      name: 'Sam',
      email: 'sam@example.com',
      username: 'Sam',
      role: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  setupLinks.issue.mockResolvedValue({
    url: `${TEST_ORIGIN}/welcome/${TOKEN}`,
    token: TOKEN,
    expiresAt: EXPIRES,
  });
  setupLinks.linkFor.mockReturnValue(`${TEST_ORIGIN}/welcome/${TOKEN}`);
  setupLinks.redeem.mockResolvedValue({ kind: 'redeemed', userId: made.id, username: 'ada' });

  const app = createApp({
    auth,
    settings,
    permissions,
    setupLinks,
    email,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    listUsers: () => Promise.resolve(users),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  return { app, auth, store, permissions, setupLinks, email, adaId: made.id };
};

/**
 * Sends a request as a browser on the test origin would.
 *
 * @param app - The application.
 * @param path - Where to send it.
 * @param options - The method, a body, and a cookie.
 * @returns The answer.
 */
const ask = (
  app: Awaited<ReturnType<typeof build>>['app'],
  path: string,
  options: { method?: string; body?: object; cookie?: string } = {},
) =>
  app.request(`${TEST_ORIGIN}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      origin: TEST_ORIGIN,
      ...(options.cookie === undefined ? {} : { cookie: options.cookie }),
      ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });

/**
 * The application with an administrator signed in.
 *
 * @returns The application, what stands in, and the administrator's cookie.
 */
const asAdministrator = async () => {
  const built = await build();
  const cookie = await signUpForTest(built.app);
  const signedUp = built.store.user.find((one) => one.id !== built.adaId);

  await makeAdministrator(built.permissions, signedUp?.id ?? '');

  return { ...built, cookie };
};

describe('serveSetupLinks', () => {
  describe('the page a link opens', () => {
    it('says what its owner still has to choose, to somebody signed out', async () => {
      const { app, setupLinks, adaId } = await build();

      setupLinks.inspect.mockResolvedValue({
        userId: adaId,
        name: 'Ada',
        username: 'ada',
        suggestedUsername: 'ada',
        email: null,
        hasPassword: false,
        expiresAt: EXPIRES,
      });

      const response = await ask(app, `/api/setup-links/${TOKEN}`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        name: 'Ada',
        username: 'ada',
        suggestedUsername: 'ada',
        hasEmail: false,
        hasPassword: false,
        canResetPassword: true,
        expiresAt: EXPIRES.toISOString(),
      });
    });

    it('says a link that no longer works does not, without saying why', async () => {
      const { app, setupLinks } = await build();

      setupLinks.inspect.mockResolvedValue(null);

      const response = await ask(app, `/api/setup-links/${TOKEN}`);

      expect(response.status).toBe(404);
      expect(await response.text()).toContain('no longer works');
    });
  });

  describe('setting the account up', () => {
    it('sets the password chosen and signs its owner in', async () => {
      const { app, auth, setupLinks } = await build();

      const response = await ask(app, `/api/setup-links/${TOKEN}`, {
        method: 'POST',
        body: { username: 'Ada', email: 'ada@example.com', password: PASSWORD },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ isSignedIn: true });
      expect(setupLinks.redeem).toHaveBeenCalledWith(TOKEN, {
        username: 'Ada',
        email: 'ada@example.com',
      });

      const cookie = response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
      const session = await auth.api.getSession({ headers: new Headers({ cookie }) });

      expect(session?.user.name).toBe('Ada');
      await expect(
        auth.api.signInUsername({ body: { username: 'ada', password: PASSWORD } }),
      ).resolves.toMatchObject({ user: { name: 'Ada' } });
    });

    it('signs its owner in without a password, to make a passkey', async () => {
      const { app } = await build();

      const response = await ask(app, `/api/setup-links/${TOKEN}`, { method: 'POST', body: {} });

      expect(await response.json()).toEqual({ isSignedIn: true });
      expect(response.headers.getSetCookie().length).toBeGreaterThan(0);
    });

    it('lets somebody who set up without a password give themselves one', async () => {
      const { app, auth } = await build();
      const redeemed = await ask(app, `/api/setup-links/${TOKEN}`, { method: 'POST', body: {} });
      const cookie = redeemed.headers.getSetCookie()[0]?.split(';')[0] ?? '';

      const response = await ask(app, '/api/setup-links/password', {
        method: 'POST',
        body: { password: PASSWORD },
        cookie,
      });

      expect(response.status).toBe(204);
      await expect(
        auth.api.signInUsername({ body: { username: 'ada', password: PASSWORD } }),
      ).resolves.toMatchObject({ user: { name: 'Ada' } });

      const again = await ask(app, '/api/setup-links/password', {
        method: 'POST',
        body: { password: PASSWORD },
        cookie,
      });

      expect(again.status).toBe(400);
    });

    it('refuses a first password to somebody signed out', async () => {
      const { app } = await build();

      const response = await ask(app, '/api/setup-links/password', {
        method: 'POST',
        body: { password: PASSWORD },
      });

      expect(response.status).toBe(401);
    });

    it('says which field somebody else holds', async () => {
      const { app, setupLinks } = await build();

      setupLinks.redeem.mockResolvedValue({ kind: 'taken', field: 'username' });

      const response = await ask(app, `/api/setup-links/${TOKEN}`, {
        method: 'POST',
        body: { username: 'sam', password: PASSWORD },
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toContain('username is already in use');
    });

    it('refuses a link that no longer works', async () => {
      const { app, setupLinks } = await build();

      setupLinks.redeem.mockResolvedValue({ kind: 'gone' });

      const response = await ask(app, `/api/setup-links/${TOKEN}`, {
        method: 'POST',
        body: { password: PASSWORD },
      });

      expect(response.status).toBe(404);
      expect(response.headers.getSetCookie()).toEqual([]);
    });

    it('refuses a password shorter than signing in needs before spending the link', async () => {
      const { app, setupLinks } = await build();

      const response = await ask(app, `/api/setup-links/${TOKEN}`, {
        method: 'POST',
        body: { password: 'short' },
      });

      expect(response.status).toBe(400);
      expect(setupLinks.redeem).not.toHaveBeenCalled();
    });
  });

  describe('an administrator handing links out', () => {
    it('makes a new link for an account', async () => {
      const { app, cookie, setupLinks, adaId } = await asAdministrator();

      const response = await ask(app, `/api/admin/accounts/${adaId}/setup-link`, {
        method: 'POST',
        body: { lifetimeDays: 1 },
        cookie,
      });

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        url: `${TEST_ORIGIN}/welcome/${TOKEN}`,
        expiresAt: EXPIRES.toISOString(),
      });
      expect(setupLinks.issue).toHaveBeenCalledWith(
        adaId,
        expect.objectContaining({ lifetimeDays: 1, origin: TEST_ORIGIN }),
      );
    });

    it('refuses a lifetime that is not on offer', async () => {
      const { app, cookie, adaId } = await asAdministrator();

      const response = await ask(app, `/api/admin/accounts/${adaId}/setup-link`, {
        method: 'POST',
        body: { lifetimeDays: 3 },
        cookie,
      });

      expect(response.status).toBe(400);
    });

    it('refuses somebody signed out', async () => {
      const { app, adaId } = await build();

      const response = await ask(app, `/api/admin/accounts/${adaId}/setup-link`, {
        method: 'POST',
        body: { lifetimeDays: 1 },
      });

      expect(response.status).toBe(401);
    });

    it('revokes a link', async () => {
      const { app, cookie, setupLinks, adaId } = await asAdministrator();

      const response = await ask(app, `/api/admin/accounts/${adaId}/setup-link`, {
        method: 'DELETE',
        cookie,
      });

      expect(response.status).toBe(204);
      expect(setupLinks.revoke).toHaveBeenCalledWith(adaId);
    });

    it('emails the link just made, rather than making another', async () => {
      const { app, cookie, setupLinks, email } = await asAdministrator();

      setupLinks.inspect.mockResolvedValue({
        userId: 'sam',
        name: 'Sam',
        username: 'Sam',
        suggestedUsername: 'Sam',
        email: 'sam@example.com',
        hasPassword: true,
        expiresAt: EXPIRES,
      });

      const response = await ask(app, '/api/admin/accounts/sam/setup-link/email', {
        method: 'POST',
        body: { token: TOKEN },
        cookie,
      });

      expect(response.status).toBe(200);
      expect(setupLinks.issue).not.toHaveBeenCalled();
      expect(email.sendSetupLink).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sam@example.com',
          name: 'Sam',
          url: `${TEST_ORIGIN}/welcome/${TOKEN}`,
          expiresAt: EXPIRES,
        }),
      );
    });

    it('makes a link to email when none is given', async () => {
      const { app, cookie, setupLinks } = await asAdministrator();

      const response = await ask(app, '/api/admin/accounts/sam/setup-link/email', {
        method: 'POST',
        body: { lifetimeDays: 30 },
        cookie,
      });

      expect(response.status).toBe(200);
      expect(setupLinks.issue).toHaveBeenCalledWith(
        'sam',
        expect.objectContaining({ lifetimeDays: 30 }),
      );
    });

    it('will not email an account without an address', async () => {
      const { app, cookie, email, adaId } = await asAdministrator();

      const response = await ask(app, `/api/admin/accounts/${adaId}/setup-link/email`, {
        method: 'POST',
        body: {},
        cookie,
      });

      expect(response.status).toBe(400);
      expect(email.sendSetupLink).not.toHaveBeenCalled();
    });

    it('will not email a link while emailing them is off', async () => {
      const { app, cookie, email } = await asAdministrator();

      email.isOn.mockResolvedValue(false);

      const response = await ask(app, '/api/admin/accounts/sam/setup-link/email', {
        method: 'POST',
        body: {},
        cookie,
      });

      expect(response.status).toBe(400);
      expect(email.sendSetupLink).not.toHaveBeenCalled();
    });

    it('says why the mail server would not take it', async () => {
      const { app, cookie, email } = await asAdministrator();

      email.sendSetupLink.mockResolvedValue({
        kind: 'failed',
        problem: { code: null, message: 'The mail server said no.', values: {} },
      });

      const response = await ask(app, '/api/admin/accounts/sam/setup-link/email', {
        method: 'POST',
        body: {},
        cookie,
      });

      expect(response.status).toBe(502);
      expect(await response.text()).toContain('The mail server said no.');
    });

    it('says whether a username is free, whatever its case, but not to the account holding it', async () => {
      const { app, cookie } = await asAdministrator();

      const taken = await ask(app, '/api/admin/accounts/username-available?username=SAM', {
        cookie,
      });
      const own = await ask(app, '/api/admin/accounts/username-available?username=SAM&userId=sam', {
        cookie,
      });
      const free = await ask(app, '/api/admin/accounts/username-available?username=nobody', {
        cookie,
      });
      const wrong = await ask(app, '/api/admin/accounts/username-available?username=a%20b', {
        cookie,
      });

      expect(await taken.json()).toEqual({ isAvailable: false });
      expect(await own.json()).toEqual({ isAvailable: true });
      expect(await free.json()).toEqual({ isAvailable: true });
      expect(await wrong.json()).toEqual({ isAvailable: false });
    });
  });
});
