import { describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { z } from 'zod';

const DevicesSchema = z.object({ devices: z.array(z.object({ isCurrent: z.boolean() })) });

const signedInAs = async (username: string, demoAccounts: readonly string[]) => {
  const { auth, settings } = createMemoryAuth();
  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    demoAccounts,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });
  const signedUp = await app.request(`${TEST_ORIGIN}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
    body: JSON.stringify({
      name: username,
      email: `${username}@example.com`,
      password: 'a long enough password',
      username,
    }),
  });
  const cookie = signedUp.headers.getSetCookie()[0]?.split(';')[0] ?? '';

  await app.request(`${TEST_ORIGIN}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
    body: JSON.stringify({ email: `${username}@example.com`, password: 'a long enough password' }),
  });

  return (method: string, path: string, body?: object) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      method,
      headers: { cookie, origin: TEST_ORIGIN, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
};

const SWITCHED_OFF = [
  ['POST', '/api/auth/revoke-other-sessions', {}],
  ['POST', '/api/account/devices/end-others', undefined],
  ['DELETE', '/api/account/devices/one-device', undefined],
  ['POST', '/api/profiles', { name: 'Visitor' }],
  ['DELETE', '/api/profiles/00000000-0000-4000-8000-000000000001', undefined],
  ['PATCH', '/api/account', { name: 'Taken over' }],
] as const;

describe('a shared demo account', () => {
  it('is refused everything switched off on the demo, by the real routes', async () => {
    const ask = await signedInAs('demo', ['demo']);

    for (const [method, path, body] of SWITCHED_OFF) {
      const answer = await ask(method, path, body);

      expect(answer.status, `${method} ${path}`).toBe(403);
      expect(await answer.json()).toMatchObject({
        code: 'error.account.theDemoAccountCannotDoThat',
      });
    }
  });

  it('turns nobody else away for being the demo', async () => {
    const ask = await signedInAs('visitor', ['demo']);

    for (const [method, path, body] of SWITCHED_OFF) {
      const answer = await ask(method, path, body);
      const said = answer.headers.get('content-type')?.includes('json') ? await answer.json() : {};

      expect(said, `${method} ${path}`).not.toMatchObject({
        code: 'error.account.theDemoAccountCannotDoThat',
      });
    }
  });

  it('sees none of the devices visitors are signed in on, nor better-auth’s list of them', async () => {
    const asTheDemo = await signedInAs('demo', ['demo']);
    const asSomebody = await signedInAs('visitor', ['demo']);

    const read = async (ask: typeof asTheDemo) =>
      DevicesSchema.parse(await (await ask('GET', '/api/account/devices')).json()).devices;

    expect(await read(asSomebody)).toHaveLength(2);
    expect((await asTheDemo('GET', '/api/account/devices')).status).toBe(403);
    expect((await asTheDemo('GET', '/api/auth/list-sessions')).status).toBe(403);
  });
});
