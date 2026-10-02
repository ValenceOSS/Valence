import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { ADMINISTRATOR_ROLE_NAME } from '@ValenceCore/functions/defaultRoles';
import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';

const BASE = 'http://localhost:8420';

const SessionSchema = z.object({ user: z.object({ id: z.string(), email: z.string() }) });

const adminPayload = {
  admin: {
    name: 'Operator',
    username: 'operator',
    email: 'admin@valence.test',
    password: 'a-long-enough-password',
  },
  trustedOrigins: ['http://192.168.1.40:8420'],
  cookieSecure: false,
};

const buildApp = (initialUserCount = 0) => {
  const { auth, settings } = createMemoryAuth();
  const state = { users: initialUserCount };
  const promoteToAdmin = vi.fn<(email: string) => Promise<string | null>>(() =>
    Promise.resolve(null),
  );
  const permissions = createMemoryPermissionService();

  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(state.users),
    promoteToAdmin,
    library: createMemoryLibraryService(),
    subtitles: createMemorySubtitleService(),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    playback: createMemoryPlaybackService(),
    permissions,
  });

  return { app, settings, state, promoteToAdmin, permissions };
};

const postSetup = (body: object, url = `${BASE}/api/setup`) =>
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

/**
 * The session cookie a response handed out, ready to send back.
 */
const cookieOf = (response: Response): string =>
  response.headers.getSetCookie()[0]?.split(';')[0] ?? '';

/**
 * The account a session cookie belongs to.
 */
const accountOf = async (
  app: ReturnType<typeof buildApp>['app'],
  cookie: string,
): Promise<{ id: string; email: string } | null> => {
  const response = await app.request(`${BASE}/api/auth/get-session`, {
    headers: { cookie, origin: BASE },
  });
  const read = SessionSchema.safeParse(await response.json());

  return read.success ? read.data.user : null;
};

/**
 * Asks the server to close the steps that follow making the administrator.
 */
const finishFlow = (app: ReturnType<typeof buildApp>['app'], cookie: string | null) =>
  app.request(`${BASE}/api/setup/finish`, {
    method: 'POST',
    headers: cookie === null ? { origin: BASE } : { cookie, origin: BASE },
  });

describe('setup status', () => {
  it('reports incomplete when no user exists', async () => {
    const { app } = buildApp(0);

    const response = await app.request('http://localhost:8420/api/setup/status');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ isComplete: false, isFlowOpen: false });
  });

  it('reports complete once a user exists', async () => {
    const { app } = buildApp(1);

    const response = await app.request('http://localhost:8420/api/setup/status');

    expect(await response.json()).toMatchObject({ isComplete: true });
  });

  it('detects the origin from the request rather than from configuration', async () => {
    const { app } = buildApp(0);

    const response = await app.request('http://192.168.1.40:8420/api/setup/status');

    expect(await response.json()).toMatchObject({
      detectedOrigin: 'http://192.168.1.40:8420',
      isSecureContext: false,
    });
  });

  it('reports a secure context when reached over https', async () => {
    const { app } = buildApp(0);

    const response = await app.request('https://valence.example/api/setup/status');

    expect(await response.json()).toMatchObject({ isSecureContext: true });
  });

  it('suggests the detected origin and the development client', async () => {
    const { app } = buildApp(0);

    const response = await app.request('http://192.168.1.40:8420/api/setup/status');
    const body = await response.json();

    expect(body).toMatchObject({
      suggestedTrustedOrigins: ['http://192.168.1.40:8420', 'http://192.168.1.40:5173'],
    });
  });
});

describe('setup completion', () => {
  it('creates the administrator and stores the configuration', async () => {
    const { app, settings, promoteToAdmin } = buildApp(0);

    const response = await app.request(postSetup(adminPayload));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ isComplete: true });
    expect(promoteToAdmin).toHaveBeenCalledWith('admin@valence.test');
    expect(await settings.read()).toMatchObject({
      trustedOrigins: ['http://192.168.1.40:8420'],
      cookieSecure: false,
    });
  });

  it('records when setup was completed', async () => {
    const { app, settings } = buildApp(0);

    await app.request(postSetup(adminPayload));

    expect((await settings.read()).setupCompletedAt).not.toBeNull();
  });

  it('refuses once any user already exists', async () => {
    const { app, promoteToAdmin } = buildApp(1);

    const response = await app.request(postSetup(adminPayload));

    expect(response.status).toBe(409);
    expect(promoteToAdmin).not.toHaveBeenCalled();
  });

  it('cannot be replayed to claim a second administrator', async () => {
    const { app, state } = buildApp(0);

    const first = await app.request(postSetup(adminPayload));
    state.users = 1;

    const second = await app.request(
      postSetup({
        ...adminPayload,
        admin: { ...adminPayload.admin, username: 'attacker', email: 'attacker@valence.test' },
      }),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
  });

  it('reports that a restart is required when the cookie mode changes', async () => {
    const { app } = buildApp(0);

    const response = await app.request(postSetup({ ...adminPayload, cookieSecure: true }));

    expect(await response.json()).toMatchObject({ restartRequired: true });
  });

  it('reports no restart when the cookie mode is unchanged', async () => {
    const { app } = buildApp(0);

    const response = await app.request(postSetup(adminPayload));

    expect(await response.json()).toMatchObject({ restartRequired: false });
  });

  it('rejects a password below the minimum length', async () => {
    const { app } = buildApp(0);

    const response = await app.request(
      postSetup({ ...adminPayload, admin: { ...adminPayload.admin, password: 'short' } }),
    );

    expect(response.status).toBe(400);
  });

  it('rejects an empty trusted origin list', async () => {
    const { app } = buildApp(0);

    const response = await app.request(postSetup({ ...adminPayload, trustedOrigins: [] }));

    expect(response.status).toBe(400);
  });

  it('rejects a trusted origin that is not a url', async () => {
    const { app } = buildApp(0);

    const response = await app.request(
      postSetup({ ...adminPayload, trustedOrigins: ['not-a-url'] }),
    );

    expect(response.status).toBe(400);
  });
});

describe('the administrator made at setup', () => {
  it('is signed in by the answer, which carries their session', async () => {
    const { app } = buildApp(0);

    const response = await app.request(postSetup(adminPayload));
    const cookie = cookieOf(response);

    expect(await response.json()).toMatchObject({ isSignedIn: true });
    expect(cookie).not.toBe('');
    expect(await accountOf(app, cookie)).toMatchObject({ email: 'admin@valence.test' });
  });

  it('keeps the address they gave in lower case', async () => {
    const { app, promoteToAdmin } = buildApp(0);

    await app.request(
      postSetup({ ...adminPayload, admin: { ...adminPayload.admin, email: 'Admin@Valence.TEST' } }),
    );

    expect(promoteToAdmin).toHaveBeenCalledWith('admin@valence.test');
  });

  it('holds a placeholder address named after the account when they give none', async () => {
    const { app, promoteToAdmin } = buildApp(0);
    const { name, username, password } = adminPayload.admin;
    const withoutEmail = { name, username, password };

    const response = await app.request(postSetup({ ...adminPayload, admin: withoutEmail }));
    const account = await accountOf(app, cookieOf(response));

    expect(response.status).toBe(200);
    expect(account).not.toBeNull();
    expect(account?.email).toBe(`${account?.id.toLowerCase() ?? ''}@${NO_EMAIL_DOMAIN}`);
    expect(promoteToAdmin.mock.calls[0]?.[0].toLowerCase()).toBe(account?.email);
  });

  it('refuses an administrator without a username', async () => {
    const { app, promoteToAdmin } = buildApp(0);
    const { name, email, password } = adminPayload.admin;
    const withoutUsername = { name, email, password };

    const response = await app.request(postSetup({ ...adminPayload, admin: withoutUsername }));

    expect(response.status).toBe(400);
    expect(promoteToAdmin).not.toHaveBeenCalled();
  });

  it('refuses when the account cannot be made', async () => {
    const { app } = buildApp(0);

    const response = await app.request(
      postSetup({ ...adminPayload, admin: { ...adminPayload.admin, email: 'not an address' } }),
    );

    expect(response.status).toBe(400);
  });
});

describe('the steps after making the administrator', () => {
  it('opens them once the administrator exists', async () => {
    const { app, settings, state } = buildApp(0);

    await app.request(postSetup(adminPayload));
    state.users = 1;

    expect((await settings.read()).setupFlow).toBe('open');
    expect(await (await app.request(`${BASE}/api/setup/status`)).json()).toMatchObject({
      isComplete: true,
      isFlowOpen: true,
    });
  });

  it('are not open on a server that was set up before them', async () => {
    const { app } = buildApp(1);

    expect(await (await app.request(`${BASE}/api/setup/status`)).json()).toMatchObject({
      isFlowOpen: false,
    });
  });

  it('are closed by the administrator', async () => {
    const { app, settings, state, permissions } = buildApp(0);
    const cookie = cookieOf(await app.request(postSetup(adminPayload)));
    const account = await accountOf(app, cookie);
    const administrator = permissions.state.roles.find(
      (role) => role.name === ADMINISTRATOR_ROLE_NAME,
    );

    permissions.state.assignments[account?.id ?? ''] = [administrator?.id ?? ''];
    state.users = 1;

    const response = await finishFlow(app, cookie);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ isFlowOpen: false });
    expect((await settings.read()).setupFlow).toBe('finished');
    expect(await (await app.request(`${BASE}/api/setup/status`)).json()).toMatchObject({
      isFlowOpen: false,
    });
  });

  it('cannot be closed by somebody signed in without administration', async () => {
    const { app, settings } = buildApp(0);
    const cookie = cookieOf(await app.request(postSetup(adminPayload)));

    const response = await finishFlow(app, cookie);

    expect(response.status).toBe(403);
    expect((await settings.read()).setupFlow).toBe('open');
  });

  it('cannot be closed by somebody not signed in', async () => {
    const { app, settings } = buildApp(0);

    await app.request(postSetup(adminPayload));

    const response = await finishFlow(app, null);

    expect(response.status).toBe(401);
    expect((await settings.read()).setupFlow).toBe('open');
  });
});

describe('settings applied after setup', () => {
  it('makes the newly trusted origin usable without a restart', async () => {
    const { app, settings } = buildApp(0);

    await app.request(postSetup(adminPayload));

    expect((await settings.read()).trustedOrigins).toContain('http://192.168.1.40:8420');
  });
});
