import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryChildAccountService } from '@ValenceServer/children/createMemoryChildAccountService';
import { hashSecret } from '@ValenceServer/locks/hashSecret';

const BASE = 'http://localhost:8420';

const PASSWORD = 'a-long-enough-password';

const ChildrenSchema = z.object({
  children: z.array(z.object({ id: z.string(), name: z.string(), hasPin: z.boolean() })),
});

const EveryoneSchema = z.object({
  profiles: z.array(z.object({ id: z.string(), signsInWith: z.string().optional() })),
});

const ProfilesSchema = z.object({ profiles: z.array(z.object({ id: z.string() })) });

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const children = createMemoryChildAccountService();
  const profiles = createMemoryProfileService();
  const createAccountWithoutPassword = vi.fn((request: { name: string; by: string | null }) =>
    Promise.resolve({ kind: 'created' as const, userId: `child-of-${request.by ?? ''}` }),
  );

  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles,
    children,
    createAccountWithoutPassword,
    listUsers: () =>
      Promise.resolve(
        store.user.map((one) => ({
          id: `child-of-${one.id}`,
          name: 'Kit',
          email: 'kit@no-email.invalid',
          role: null,
          createdAt: '2026-10-15T00:00:00.000Z',
        })),
      ),
  });

  const signUp = async (email: string) => {
    const response = await app.request(`${BASE}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: BASE },
      body: JSON.stringify({ name: email, email, password: PASSWORD }),
    });

    return response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
  };

  const ask = (cookie: string, path: string, init: RequestInit = {}) =>
    app.request(`${BASE}${path}`, {
      ...init,
      headers: { origin: BASE, 'content-type': 'application/json', cookie },
    });

  return { app, ask, signUp, store, children, createAccountWithoutPassword };
};

describe('a parent’s children', () => {
  it('refuses somebody who is not signed in', async () => {
    const { ask } = build();

    expect((await ask('', '/api/account/children')).status).toBe(401);
  });

  it('adds a child, with a PIN, and lists them by name', async () => {
    const { ask, signUp, store, createAccountWithoutPassword } = build();
    const cookie = await signUp('ada@valence.local');
    const added = await ask(cookie, '/api/account/children', {
      method: 'POST',
      body: JSON.stringify({ name: 'Kit', pin: '1234' }),
    });

    expect(added.status).toBe(200);
    expect(createAccountWithoutPassword).toHaveBeenCalledWith({
      name: 'Kit',
      by: store.user[0]?.id,
    });
    expect(ChildrenSchema.parse(await (await ask(cookie, '/api/account/children')).json())).toEqual(
      { children: [{ id: `child-of-${store.user[0]?.id ?? ''}`, name: 'Kit', hasPin: true }] },
    );
  });

  it('refuses a PIN that is not four to eight digits', async () => {
    const { ask, signUp } = build();
    const cookie = await signUp('ada@valence.local');

    const added = await ask(cookie, '/api/account/children', {
      method: 'POST',
      body: JSON.stringify({ name: 'Kit', pin: '12' }),
    });

    expect(added.status).toBe(400);
  });

  it('will not let a child add children of their own', async () => {
    const { ask, signUp, store, children } = build();
    const cookie = await signUp('kit@valence.local');

    await children.adopt('somebody', store.user[0]?.id ?? '');

    const added = await ask(cookie, '/api/account/children', {
      method: 'POST',
      body: JSON.stringify({ name: 'Pip' }),
    });

    expect(added.status).toBe(403);
  });

  it('lets only the parent change a child’s PIN', async () => {
    const { ask, signUp, children } = build();
    const parent = await signUp('ada@valence.local');
    const stranger = await signUp('bea@valence.local');

    await ask(parent, '/api/account/children', {
      method: 'POST',
      body: JSON.stringify({ name: 'Kit' }),
    });

    const [kit] = ChildrenSchema.parse(
      await (await ask(parent, '/api/account/children')).json(),
    ).children;
    const path = `/api/account/children/${kit?.id ?? ''}/pin`;

    expect(
      (await ask(stranger, path, { method: 'PUT', body: JSON.stringify({ pin: '9999' }) })).status,
    ).toBe(403);
    expect(
      (await ask(parent, path, { method: 'PUT', body: JSON.stringify({ pin: '9999' }) })).status,
    ).toBe(200);
    expect(await children.pinHashOf(kit?.id ?? '')).not.toBeNull();
  });
});

describe('a child on the way in', () => {
  const aChild = async (pin: string | null) => {
    const built = build();
    const cookie = await built.signUp('kit@valence.local');
    const [profile] = ProfilesSchema.parse(
      await (await built.ask(cookie, '/api/profiles')).json(),
    ).profiles;
    const userId = built.store.user[0]?.id ?? '';

    await built.children.adopt('parent', userId);
    await built.children.setPinHash(userId, pin === null ? null : hashSecret(pin));

    const signIn = (body: object) =>
      built.ask('', `/api/profiles/${profile?.id ?? ''}/sign-in`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

    return { ...built, profileId: profile?.id ?? '', signIn };
  };

  it('is shown with how they sign in, though they have no password', async () => {
    const { ask, profileId } = await aChild('1234');
    const everyone = EveryoneSchema.parse(await (await ask('', '/api/profiles/everyone')).json());

    expect(everyone.profiles).toContainEqual({ id: profileId, signsInWith: 'pin' });
  });

  it('is let in with a tap where they have no PIN', async () => {
    const { signIn } = await aChild(null);
    const response = await signIn({});

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().join(' ')).toContain('session_token');
  });

  it('is let in with the right PIN, and not the wrong one', async () => {
    const { signIn } = await aChild('1234');

    expect((await signIn({ password: '0000' })).status).toBe(401);
    expect((await signIn({ password: '1234' })).status).toBe(200);
  });

  it('stops being listened to after five wrong PINs in a minute', async () => {
    const { signIn } = await aChild('1234');

    for (let tried = 0; tried < 5; tried += 1) {
      expect((await signIn({ password: '0000' })).status).toBe(401);
    }

    expect((await signIn({ password: '1234' })).status).toBe(429);
  });
});
