import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signedInApp } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { saying } from '@ValenceI18n/saying';
import { NO_EMAIL } from './NO_EMAIL';
import type { EmailService } from './EmailService';

const BASE = 'http://localhost:8420';

const CHANGE = {
  isEnabled: true,
  host: 'smtp.resend.com',
  port: 465,
  security: 'tls',
  username: 'resend',
  password: '',
  fromName: 'Home',
  fromAddress: 'valence@example.com',
  sendsPasswordResets: true,
  sendsSetupLinks: true,
};

/**
 * The app over an email service, signed in as somebody who may or may not administer it.
 *
 * @param email - The email service.
 * @param isAdministrator - Whether they hold every permission.
 * @returns The app.
 */
const build = (email: EmailService, isAdministrator: boolean) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const app = createApp({
    auth,
    settings,
    permissions,
    email,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    subtitles: createMemorySubtitleService(),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    playback: createMemoryPlaybackService(),
  });

  return signedInApp(app, { store, permissions, isAdministrator });
};

/**
 * A JSON request.
 *
 * @param method - The method.
 * @param body - What it carries.
 * @returns The request's options.
 */
const sending = (method: string, body: object): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

describe('the email endpoints', () => {
  it('reads and saves the setup for an administrator', async () => {
    const change = vi.fn(() => NO_EMAIL.setup());
    const app = build({ ...NO_EMAIL, change }, true);

    const read = await app.request(`${BASE}/api/admin/email`);

    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({ isEnabled: false, hasPassword: false });

    const saved = await app.request(`${BASE}/api/admin/email`, sending('PUT', CHANGE));

    expect(saved.status).toBe(200);
    expect(change).toHaveBeenCalledWith(CHANGE);
  });

  it('refuses a sending address that is not one', async () => {
    const app = build(NO_EMAIL, true);
    const saved = await app.request(
      `${BASE}/api/admin/email`,
      sending('PUT', { ...CHANGE, fromAddress: 'not an address' }),
    );

    expect(saved.status).toBe(400);
  });

  it('sends a test and says how it went', async () => {
    const problem = saying('server.email.createEmailService.thereIsNoMailServer');
    const sendTest = vi
      .fn<EmailService['sendTest']>()
      .mockResolvedValueOnce({ kind: 'sent' })
      .mockResolvedValueOnce({ kind: 'failed', problem })
      .mockResolvedValueOnce({ kind: 'off' });
    const app = build({ ...NO_EMAIL, sendTest }, true);
    const test = () =>
      app.request(`${BASE}/api/admin/email/test`, sending('POST', { to: 'ada@example.com' }));

    expect(await (await test()).json()).toEqual({ sent: true, problem: null });
    expect(await (await test()).json()).toEqual({ sent: false, problem });
    expect(await (await test()).json()).toMatchObject({
      sent: false,
      problem: { code: problem.code },
    });
    expect(sendTest).toHaveBeenCalledWith('ada@example.com');
  });

  it('is for administrators only', async () => {
    const app = build(NO_EMAIL, false);

    expect((await app.request(`${BASE}/api/admin/email`)).status).toBe(403);
    expect((await app.request(`${BASE}/api/admin/email`, sending('PUT', CHANGE))).status).toBe(403);
    expect(
      (await app.request(`${BASE}/api/admin/email/test`, sending('POST', { to: 'a@b.co' }))).status,
    ).toBe(403);
  });
});
