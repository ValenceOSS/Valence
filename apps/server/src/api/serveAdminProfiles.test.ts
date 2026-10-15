import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { makeAdministrator, signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { hashSecret } from '@ValenceServer/locks/hashSecret';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryProfileLimits } from '@ValenceServer/profiles/limits/createMemoryProfileLimits';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

const BASE = 'http://localhost:8420';

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';

const PASSWORD = 'a-long-enough-password';

const ProfileListSchema = z.object({
  profiles: z.array(
    z.object({ id: z.string(), name: z.string(), isOwner: z.boolean(), hasPin: z.boolean() }),
  ),
  chosenProfileId: z.string().nullable(),
});

const RefusalSchema = z.object({ code: z.string().nullable() });

const shelf = (id: string, name: string): Library => ({
  id,
  name,
  kind: 'movies',
  path: `/media/${name.toLowerCase()}`,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
});

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const profiles = createMemoryProfileService();
  const permissions = createMemoryPermissionService();
  const profileLimits = createMemoryProfileLimits();

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(store.user.length),
    promoteToAdmin: () => Promise.resolve(null),
    listUsers: () =>
      Promise.resolve(
        store.user.map((one) => ({
          id: one.id,
          name: one.id,
          email: `${one.id}@valence.local`,
          role: one.role ?? null,
          createdAt: '2026-01-01T00:00:00.000Z',
        })),
      ),
    library: createMemoryLibraryService({ libraries: [shelf(FILMS, 'Films')], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles,
    profileLimits,
  });

  return { app, store, settings, profiles, permissions, profileLimits };
};

type Context = ReturnType<typeof build>;

/**
 * Asks the application something as whoever holds a cookie.
 *
 * @param context - The application.
 * @param cookie - Whose session.
 * @param method - How to ask.
 * @param path - Where to ask.
 * @param body - What to send, if anything.
 * @returns The answer.
 */
const ask = async (context: Context, cookie: string, method: string, path: string, body?: object) =>
  context.app.request(`${BASE}${path}`, {
    method,
    headers: {
      cookie,
      origin: BASE,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

/**
 * Signs somebody up and has their device choose their only profile.
 *
 * @param context - The application.
 * @param name - Who they are.
 * @returns Their cookie, their account and their profile.
 */
const somebody = async (context: Context, name: string) => {
  const cookie = await signUpForTest(context.app, {
    name,
    email: `${name.toLowerCase()}@valence.local`,
    password: PASSWORD,
  });
  const accountId = context.store.user.at(-1)?.id ?? '';
  const listed = ProfileListSchema.parse(
    await (await ask(context, cookie, 'GET', '/api/profiles')).json(),
  );

  return { cookie, accountId, profileId: listed.profiles[0]?.id ?? '' };
};

/**
 * Gives an account a role of its own, at a rank, holding only what is named.
 *
 * @param context - The application.
 * @param accountId - Whose account.
 * @param position - How senior the role is.
 * @param permissions - What it holds.
 */
const giveARole = async (
  context: Context,
  accountId: string,
  position: number,
  permissions: GrantedPermission[],
): Promise<void> => {
  const role = await context.permissions.createRole({
    name: `Rank ${position.toString()}`,
    position,
    permissions,
    color: null,
  });

  await context.permissions.assignRole(accountId, role.id);
};

/**
 * An administrator, and a household of an owner and a child on somebody else's account.
 *
 * @param context - The application.
 * @returns The administrator, and the household.
 */
const anAdministratorAndAHousehold = async (context: Context) => {
  const administrator = await somebody(context, 'Ada');

  await makeAdministrator(context.permissions, administrator.accountId);

  const household = await somebody(context, 'Dan');
  const kid = await context.profiles.create(household.accountId, {
    name: 'Kid',
    colour: '#3ac47d',
  });

  return {
    administrator,
    household: { ...household, ownerId: household.profileId, kidId: kid.id },
    base: `/api/admin/accounts/${household.accountId}/profiles`,
  };
};

const listedAt = async (context: Context, cookie: string, base: string) =>
  ProfileListSchema.parse(await (await ask(context, cookie, 'GET', base)).json());

describe('an administrator managing somebody’s profiles', () => {
  it('lists the profiles on somebody else’s account, with nobody chosen', async () => {
    const context = build();
    const { administrator, household, base } = await anAdministratorAndAHousehold(context);

    const listed = await listedAt(context, administrator.cookie, base);

    expect(listed.chosenProfileId).toBeNull();
    expect(listed.profiles.map((profile) => profile.id)).toEqual([
      household.ownerId,
      household.kidId,
    ]);
  });

  it('adds, renames and removes somebody', async () => {
    const context = build();
    const { administrator, household, base } = await anAdministratorAndAHousehold(context);

    const added = await ask(context, administrator.cookie, 'POST', base, {
      name: 'Sam',
      colour: '#3ac47d',
    });

    expect(added.status).toBe(201);
    expect(
      (
        await ask(context, administrator.cookie, 'PATCH', `${base}/${household.kidId}`, {
          name: 'Big Kid',
          colour: '#3ac47d',
        })
      ).status,
    ).toBe(204);
    expect(
      (await ask(context, administrator.cookie, 'DELETE', `${base}/${household.kidId}`)).status,
    ).toBe(204);
    expect(
      (await listedAt(context, administrator.cookie, base)).profiles.map((profile) => profile.name),
    ).toEqual(['Dan', 'Sam']);
  });

  it('never removes the owner’s profile', async () => {
    const context = build();
    const { administrator, household, base } = await anAdministratorAndAHousehold(context);

    const refused = await ask(
      context,
      administrator.cookie,
      'DELETE',
      `${base}/${household.ownerId}`,
    );

    expect(refused.status).toBe(409);
    expect(RefusalSchema.parse(await refused.json()).code).toBe(
      'error.profiles.theOwnerProfileStays',
    );
  });

  it('clears a PIN the owner forgot, even one the account needs', async () => {
    const context = build();
    const { administrator, household, base } = await anAdministratorAndAHousehold(context);

    await giveARole(context, household.accountId, 100, ['library.edit']);
    await context.profiles.setPin(household.ownerId, hashSecret('2468'));

    expect(
      (
        await ask(context, administrator.cookie, 'PUT', `${base}/${household.ownerId}/pin`, {
          pin: null,
        })
      ).status,
    ).toBe(204);
    expect((await listedAt(context, administrator.cookie, base)).profiles[0]?.hasPin).toBe(false);
  });

  it('stops a profile asking, and hands the account over', async () => {
    const context = build();
    const { administrator, household, base } = await anAdministratorAndAHousehold(context);

    expect(
      (
        await ask(context, administrator.cookie, 'PUT', `${base}/${household.kidId}/may-request`, {
          mayRequest: false,
        })
      ).status,
    ).toBe(204);
    expect((await context.profiles.standingOf(household.kidId))?.mayRequest).toBe(false);
    expect(
      (await ask(context, administrator.cookie, 'POST', `${base}/${household.kidId}/owner`)).status,
    ).toBe(204);
    expect(
      (await listedAt(context, administrator.cookie, base)).profiles.map(
        (profile) => profile.isOwner,
      ),
    ).toEqual([true, false]);
  });

  it('narrows what a profile may watch, and lets it back', async () => {
    const context = build();
    const { administrator, household, base } = await anAdministratorAndAHousehold(context);
    const shelfOf = `${base}/${household.kidId}/libraries/${FILMS}`;

    expect((await ask(context, administrator.cookie, 'DELETE', shelfOf)).status).toBe(204);
    expect(
      (await ask(context, administrator.cookie, 'PUT', `${shelfOf}/ceiling`, { maximumAge: 7 }))
        .status,
    ).toBe(204);
    await expect(context.profileLimits.refusedLibraries(household.kidId)).resolves.toEqual([FILMS]);
    await expect(context.profileLimits.ceilingsFor(household.kidId)).resolves.toEqual([
      { libraryId: FILMS, maximumAge: 7, allowsUnrated: false },
    ]);

    const libraries = await ask(
      context,
      administrator.cookie,
      'GET',
      `${base}/${household.kidId}/libraries`,
    );

    expect(await libraries.json()).toMatchObject({
      libraries: [{ id: FILMS, mayView: false, maximumAge: 7 }],
    });

    await ask(context, administrator.cookie, 'PUT', shelfOf);
    await ask(context, administrator.cookie, 'DELETE', `${shelfOf}/ceiling`);

    await expect(context.profileLimits.refusedLibraries(household.kidId)).resolves.toEqual([]);
    await expect(context.profileLimits.ceilingsFor(household.kidId)).resolves.toEqual([]);
  });

  it('has no profile of another account to manage under this one', async () => {
    const context = build();
    const { administrator, base } = await anAdministratorAndAHousehold(context);

    expect(
      (
        await ask(context, administrator.cookie, 'PATCH', `${base}/${administrator.profileId}`, {
          name: 'Moved',
          colour: '#3ac47d',
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await ask(context, administrator.cookie, 'PUT', `${base}/${administrator.profileId}/pin`, {
          pin: '2468',
        })
      ).status,
    ).toBe(404);
  });

  it('has no account to manage that is not there', async () => {
    const context = build();
    const { administrator } = await anAdministratorAndAHousehold(context);

    const refused = await ask(
      context,
      administrator.cookie,
      'GET',
      '/api/admin/accounts/nobody/profiles',
    );

    expect(refused.status).toBe(404);
    expect(RefusalSchema.parse(await refused.json()).code).toBe('error.account.noSuchAccount');
  });

  it('may manage the profiles on their own account', async () => {
    const context = build();
    const { administrator } = await anAdministratorAndAHousehold(context);

    expect(
      (
        await ask(
          context,
          administrator.cookie,
          'GET',
          `/api/admin/accounts/${administrator.accountId}/profiles`,
        )
      ).status,
    ).toBe(200);
  });
});

describe('who may manage somebody else’s profiles', () => {
  it('is somebody holding account.profiles', async () => {
    const context = build();
    const { household, base } = await anAdministratorAndAHousehold(context);
    const keeper = await somebody(context, 'Keeper');

    await giveARole(context, keeper.accountId, 200, ['account.profiles']);

    expect((await ask(context, keeper.cookie, 'GET', base)).status).toBe(200);
    expect(
      (await ask(context, keeper.cookie, 'PUT', `${base}/${household.kidId}/pin`, { pin: '2468' }))
        .status,
    ).toBe(204);
  });

  it('is not somebody without it, however much else they may do', async () => {
    const context = build();
    const { household, base } = await anAdministratorAndAHousehold(context);
    const manager = await somebody(context, 'Manager');

    await giveARole(context, manager.accountId, 200, ['account.manage', 'library.edit']);

    for (const [method, path, body] of [
      ['GET', base, undefined],
      ['POST', base, { name: 'Sam', colour: '#3ac47d' }],
      ['DELETE', `${base}/${household.kidId}`, undefined],
      ['PUT', `${base}/${household.ownerId}/pin`, { pin: null }],
      ['POST', `${base}/${household.kidId}/owner`, undefined],
    ] as const) {
      const refused = await ask(context, manager.cookie, method, path, body);

      expect(refused.status).toBe(403);
      expect(RefusalSchema.parse(await refused.json()).code).toBe('common.thatIsForAdministrators');
    }

    await expect(context.profiles.list(household.accountId)).resolves.toHaveLength(2);
  });

  it('is not the household itself, which manages its own at its own address', async () => {
    const context = build();
    const { household, base } = await anAdministratorAndAHousehold(context);

    expect((await ask(context, household.cookie, 'GET', base)).status).toBe(403);
  });

  it('is not an administrator watching as somebody other than their account’s owner', async () => {
    const context = build();
    const { administrator, base } = await anAdministratorAndAHousehold(context);
    const kid = await context.profiles.create(administrator.accountId, {
      name: 'Little Ada',
      colour: '#3ac47d',
    });

    await ask(context, administrator.cookie, 'POST', `/api/profiles/${kid.id}/choose`, {});

    expect((await ask(context, administrator.cookie, 'GET', base)).status).toBe(403);
  });

  it('is not anybody acting on an account at or above their own rank', async () => {
    const context = build();
    const { administrator } = await anAdministratorAndAHousehold(context);
    const keeper = await somebody(context, 'Keeper');

    await giveARole(context, keeper.accountId, 200, ['account.profiles']);

    const base = `/api/admin/accounts/${administrator.accountId}/profiles`;
    const answers = [
      await ask(context, keeper.cookie, 'GET', base),
      await ask(context, keeper.cookie, 'PUT', `${base}/${administrator.profileId}/pin`, {
        pin: null,
      }),
      await ask(context, keeper.cookie, 'POST', base, { name: 'Spy', colour: '#3ac47d' }),
    ];

    for (const refused of answers) {
      expect(refused.status).toBe(403);
      expect(RefusalSchema.parse(await refused.json()).code).toBe(
        'server.appContext.thatAccountIsAtOrAbove',
      );
    }

    await expect(context.profiles.list(administrator.accountId)).resolves.toHaveLength(1);
  });

  it('is not anybody acting on the server’s owner, however they rank', async () => {
    const context = build();
    const owner = await somebody(context, 'Owner');
    const keeper = await somebody(context, 'Keeper');

    await context.settings.write({ ownerAccountId: owner.accountId });
    await giveARole(context, keeper.accountId, 900, ['account.profiles']);

    const refused = await ask(
      context,
      keeper.cookie,
      'POST',
      `/api/admin/accounts/${owner.accountId}/profiles`,
      { name: 'Spy', colour: '#3ac47d' },
    );

    expect(refused.status).toBe(403);
    await expect(context.profiles.list(owner.accountId)).resolves.toHaveLength(1);
  });

  it('is not somebody who is not signed in', async () => {
    const context = build();
    const { base } = await anAdministratorAndAHousehold(context);

    expect((await ask(context, '', 'GET', base)).status).toBe(401);
  });
});
