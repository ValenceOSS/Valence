import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { makeAdministrator, signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryChosenProfiles } from '@ValenceServer/profiles/createMemoryChosenProfiles';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryProfileLimits } from '@ValenceServer/profiles/limits/createMemoryProfileLimits';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import type { Library } from '@ValenceContracts/schemas/Library';

const BASE = 'http://localhost:8420';

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';

const NOBODY = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const CREDENTIALS = {
  name: 'Dan',
  email: 'dan@valence.local',
  password: 'a-long-enough-password',
};

const ProfileListSchema = z.object({
  profiles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isOwner: z.boolean(),
      hasPin: z.boolean(),
      mayRequest: z.boolean(),
    }),
  ),
  chosenProfileId: z.string().nullable(),
});

const RefusalSchema = z.object({
  code: z.string().nullable(),
  needs: z.string().optional(),
});

const LibrariesSchema = z.object({
  libraries: z.array(
    z.object({ id: z.string(), mayView: z.boolean(), maximumAge: z.number().nullable() }),
  ),
});

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
  const chosenProfiles = createMemoryChosenProfiles();
  const profileLimits = createMemoryProfileLimits();
  const onNamesChanged = vi.fn<() => void>();

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [shelf(FILMS, 'Films')], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles,
    chosenProfiles,
    profileLimits,
    onNamesChanged,
  });

  return { app, auth, store, profiles, permissions, chosenProfiles, profileLimits, onNamesChanged };
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
 * The code a refusal carries, and what it says it needs.
 *
 * @param response - The answer.
 * @returns The refusal.
 */
const refusalIn = async (response: Response) => RefusalSchema.parse(await response.json());

/**
 * The profiles on the account, and which is chosen, as a cookie's session sees them.
 *
 * @param context - The application.
 * @param cookie - Whose session.
 * @returns The listing.
 */
const listed = async (context: Context, cookie: string) =>
  ProfileListSchema.parse(await (await ask(context, cookie, 'GET', '/api/profiles')).json());

/**
 * Signs in again to an account that already exists, as a second device would.
 *
 * @param context - The application.
 * @returns The new session's cookie.
 */
const anotherDevice = async (context: Context): Promise<string> => {
  const response = await context.app.request(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({ email: CREDENTIALS.email, password: CREDENTIALS.password }),
  });

  return response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
};

/**
 * A household of an owner and a child, signed in on one device that is watching as the owner.
 *
 * @param context - The application.
 * @returns The cookie, the account and both profiles.
 */
const aHousehold = async (context: Context) => {
  const cookie = await signUpForTest(context.app, context.auth, CREDENTIALS);
  const [owner] = (await listed(context, cookie)).profiles;
  const made = await ask(context, cookie, 'POST', '/api/profiles', {
    name: 'Kid',
    colour: '#3ac47d',
  });
  const kid = z.object({ id: z.string() }).parse(await made.json());

  return {
    cookie,
    accountId: context.store.user[0]?.id ?? '',
    ownerId: owner?.id ?? '',
    kidId: kid.id,
  };
};

/**
 * The same household, with the device watching as the child.
 *
 * @param context - The application.
 * @returns The cookie, the account and both profiles.
 */
const watchingAsTheKid = async (context: Context) => {
  const household = await aHousehold(context);

  await ask(context, household.cookie, 'POST', `/api/profiles/${household.kidId}/choose`, {});

  return household;
};

describe('choosing who is watching', () => {
  it('lists the account’s profiles and which one this device chose', async () => {
    const context = build();
    const { cookie, ownerId, kidId } = await aHousehold(context);

    const answer = await listed(context, cookie);

    expect(answer.chosenProfileId).toBe(ownerId);
    expect(answer.profiles.map((profile) => [profile.id, profile.isOwner])).toEqual([
      [ownerId, true],
      [kidId, false],
    ]);
  });

  it('chooses the account’s only profile without asking', async () => {
    const context = build();
    const cookie = await signUpForTest(context.app, context.auth, CREDENTIALS);

    const answer = await listed(context, cookie);

    expect(answer.chosenProfileId).toBe(answer.profiles[0]?.id);
  });

  it('chooses another profile on this device', async () => {
    const context = build();
    const { cookie, kidId } = await aHousehold(context);

    const response = await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {});

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: kidId, name: 'Kid' });
    expect((await listed(context, cookie)).chosenProfileId).toBe(kidId);
  });

  it('has no profile to choose that is not on the account', async () => {
    const context = build();
    const { cookie } = await aHousehold(context);

    const response = await ask(context, cookie, 'POST', `/api/profiles/${NOBODY}/choose`, {});

    expect(response.status).toBe(404);
  });

  it('turns away an address that is not a profile', async () => {
    const context = build();
    const { cookie } = await aHousehold(context);

    expect((await ask(context, cookie, 'POST', '/api/profiles/not-a-uuid/choose', {})).status).toBe(
      400,
    );
  });

  it('makes a new device on a shared account choose before anything else', async () => {
    const context = build();

    await aHousehold(context);

    const cookie = await anotherDevice(context);
    const refused = await ask(context, cookie, 'GET', '/api/libraries');

    expect(refused.status).toBe(403);
    expect((await refusalIn(refused)).code).toBe('error.profiles.chooseWhoIsWatching');
    expect((await listed(context, cookie)).chosenProfileId).toBeNull();
  });

  it('turns a device that has not chosen away from managing anybody', async () => {
    const context = build();
    const { kidId } = await aHousehold(context);
    const cookie = await anotherDevice(context);

    const refused = await ask(context, cookie, 'PATCH', `/api/profiles/${kidId}`, {
      name: 'Mine now',
      colour: '#3ac47d',
    });

    expect(refused.status).toBe(403);
    expect((await refusalIn(refused)).code).toBe('error.profiles.chooseWhoIsWatching');
  });

  it('locks a device again, so somebody has to choose', async () => {
    const context = build();
    const { cookie } = await aHousehold(context);

    expect((await ask(context, cookie, 'DELETE', '/api/profiles/chosen')).status).toBe(204);
    expect((await listed(context, cookie)).chosenProfileId).toBeNull();
    expect((await ask(context, cookie, 'GET', '/api/libraries')).status).toBe(403);
  });

  it('lets a device that has chosen reach everything else again', async () => {
    const context = build();
    const { kidId } = await aHousehold(context);
    const cookie = await anotherDevice(context);

    await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {});

    expect((await ask(context, cookie, 'GET', '/api/libraries')).status).toBe(200);
  });

  it('tells somebody who is not signed in nothing about choosing', async () => {
    const context = build();

    expect((await ask(context, '', 'POST', `/api/profiles/${NOBODY}/choose`, {})).status).toBe(401);
    expect((await ask(context, '', 'DELETE', '/api/profiles/chosen')).status).toBe(401);
  });
});

describe('a profile that is not the owner', () => {
  it('may not change the account', async () => {
    const context = build();
    const { cookie } = await watchingAsTheKid(context);

    const refused = await ask(context, cookie, 'PATCH', '/api/account', { name: 'Kid’s house' });

    expect(refused.status).toBe(403);
    expect((await refusalIn(refused)).code).toBe('error.profiles.onlyTheOwnerCanDoThat');
  });

  it('may not change the account’s password', async () => {
    const context = build();
    const { cookie } = await watchingAsTheKid(context);

    const refused = await ask(context, cookie, 'POST', '/api/auth/change-password', {
      currentPassword: CREDENTIALS.password,
      newPassword: 'another-long-enough-password',
    });

    expect(refused.status).toBe(403);
    expect((await refusalIn(refused)).code).toBe('error.profiles.onlyTheOwnerCanDoThat');
  });

  it('may not add anybody to the account', async () => {
    const context = build();
    const { cookie } = await watchingAsTheKid(context);

    const refused = await ask(context, cookie, 'POST', '/api/profiles', {
      name: 'Friend',
      colour: '#3ac47d',
    });

    expect(refused.status).toBe(403);
    expect((await listed(context, cookie)).profiles).toHaveLength(2);
  });

  it('may not remove anybody, hand the account over or change what anybody may do', async () => {
    const context = build();
    const { cookie, ownerId, kidId } = await watchingAsTheKid(context);

    const answers = [
      await ask(context, cookie, 'DELETE', `/api/profiles/${kidId}`),
      await ask(context, cookie, 'POST', `/api/profiles/${kidId}/owner`),
      await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/may-request`, { mayRequest: true }),
      await ask(context, cookie, 'GET', `/api/profiles/${kidId}/libraries`),
      await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/libraries/${FILMS}`),
      await ask(context, cookie, 'PUT', `/api/profiles/${ownerId}/pin`, { pin: '2468' }),
      await ask(context, cookie, 'PATCH', `/api/profiles/${ownerId}`, {
        name: 'Mine now',
        colour: '#3ac47d',
      }),
    ];

    expect(answers.map((answer) => answer.status)).toEqual([403, 403, 403, 403, 403, 403, 403]);
  });

  it('may change itself and its own PIN', async () => {
    const context = build();
    const { cookie, kidId } = await watchingAsTheKid(context);

    expect(
      (
        await ask(context, cookie, 'PATCH', `/api/profiles/${kidId}`, {
          name: 'Big Kid',
          colour: '#3ac47d',
        })
      ).status,
    ).toBe(204);
    expect(
      (await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/pin`, { pin: '2468' })).status,
    ).toBe(204);
    expect((await listed(context, cookie)).profiles[1]).toMatchObject({
      name: 'Big Kid',
      hasPin: true,
    });
    expect(context.onNamesChanged).toHaveBeenCalled();
  });
});

describe('the account’s owner', () => {
  it('may change the account’s password', async () => {
    const context = build();
    const { cookie } = await aHousehold(context);

    const response = await ask(context, cookie, 'POST', '/api/auth/change-password', {
      currentPassword: CREDENTIALS.password,
      newPassword: 'another-long-enough-password',
    });

    expect(response.status).toBe(200);
  });

  it('may not make API keys behind Valence’s back either', async () => {
    const context = build();
    const { cookie } = await aHousehold(context);

    const refused = await ask(context, cookie, 'POST', '/api/auth/api-key/create', {
      name: 'Sneaky',
    });

    expect(refused.status).toBe(403);
    expect((await refusalIn(refused)).code).toBe('error.profiles.keysAreMadeInValence');
  });

  it('stops a profile asking for things, and cannot stop itself', async () => {
    const context = build();
    const { cookie, ownerId, kidId } = await aHousehold(context);

    expect(
      (
        await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/may-request`, {
          mayRequest: false,
        })
      ).status,
    ).toBe(204);
    expect((await listed(context, cookie)).profiles[1]?.mayRequest).toBe(false);

    const refused = await ask(context, cookie, 'PUT', `/api/profiles/${ownerId}/may-request`, {
      mayRequest: false,
    });

    expect(refused.status).toBe(409);
    expect((await refusalIn(refused)).code).toBe('error.profiles.theOwnerHasNoLimits');
  });

  it('keeps a profile out of a library, caps it, and lets it back', async () => {
    const context = build();
    const { cookie, kidId } = await aHousehold(context);
    const libraries = async () =>
      LibrariesSchema.parse(
        await (await ask(context, cookie, 'GET', `/api/profiles/${kidId}/libraries`)).json(),
      ).libraries;

    expect(
      (await ask(context, cookie, 'DELETE', `/api/profiles/${kidId}/libraries/${FILMS}`)).status,
    ).toBe(204);
    expect(
      (
        await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/libraries/${FILMS}/ceiling`, {
          maximumAge: 12,
        })
      ).status,
    ).toBe(204);
    expect(await libraries()).toEqual([{ id: FILMS, mayView: false, maximumAge: 12 }]);

    await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/libraries/${FILMS}`);
    await ask(context, cookie, 'DELETE', `/api/profiles/${kidId}/libraries/${FILMS}/ceiling`);

    expect(await libraries()).toEqual([{ id: FILMS, mayView: true, maximumAge: null }]);
  });

  it('cannot cap a library above the oldest age anything is certificated for', async () => {
    const context = build();
    const { cookie, kidId } = await aHousehold(context);

    expect(
      (
        await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/libraries/${FILMS}/ceiling`, {
          maximumAge: 22,
        })
      ).status,
    ).toBe(400);
  });

  it('cannot narrow itself', async () => {
    const context = build();
    const { cookie, ownerId } = await aHousehold(context);

    const refused = await ask(
      context,
      cookie,
      'DELETE',
      `/api/profiles/${ownerId}/libraries/${FILMS}`,
    );

    expect(refused.status).toBe(409);
  });

  it('has no library to narrow that the server does not hold', async () => {
    const context = build();
    const { cookie, kidId } = await aHousehold(context);

    expect(
      (await ask(context, cookie, 'DELETE', `/api/profiles/${kidId}/libraries/nowhere`)).status,
    ).toBe(404);
  });

  it('cannot remove its own profile', async () => {
    const context = build();
    const { cookie, ownerId } = await aHousehold(context);

    const refused = await ask(context, cookie, 'DELETE', `/api/profiles/${ownerId}`);

    expect(refused.status).toBe(409);
    expect((await refusalIn(refused)).code).toBe('error.profiles.theOwnerProfileStays');
  });

  it('hands the account over, and is then one of the household', async () => {
    const context = build();
    const { cookie, ownerId, kidId } = await aHousehold(context);

    expect((await ask(context, cookie, 'POST', `/api/profiles/${kidId}/owner`)).status).toBe(204);

    const after = await listed(context, cookie);

    expect(after.profiles.map((profile) => [profile.id, profile.isOwner])).toEqual([
      [kidId, true],
      [ownerId, false],
    ]);
    expect(
      (await ask(context, cookie, 'PATCH', '/api/account', { name: 'Still mine' })).status,
    ).toBe(403);
  });

  it('turns away a PIN that is not four to eight digits', async () => {
    const context = build();
    const { cookie, kidId } = await aHousehold(context);

    for (const pin of ['123', '123456789', 'abcd']) {
      expect(
        (await ask(context, cookie, 'PUT', `/api/profiles/${kidId}/pin`, { pin })).status,
      ).toBe(400);
    }
  });
});

describe('choosing a profile with a PIN', () => {
  /**
   * A household whose child has a PIN, and a second device that has not chosen yet.
   *
   * @param context - The application.
   * @returns The second device's cookie and the child's profile.
   */
  const aLockedKid = async (context: Context) => {
    const household = await aHousehold(context);

    await ask(context, household.cookie, 'PUT', `/api/profiles/${household.kidId}/pin`, {
      pin: '2468',
    });

    return { ...household, cookie: await anotherDevice(context) };
  };

  it('asks for the PIN', async () => {
    const context = build();
    const { cookie, kidId } = await aLockedKid(context);

    const refused = await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {});

    expect(refused.status).toBe(401);
    expect(await refusalIn(refused)).toEqual({ code: 'error.profiles.enterThePin', needs: 'pin' });
  });

  it('refuses the wrong PIN and takes the right one', async () => {
    const context = build();
    const { cookie, kidId } = await aLockedKid(context);

    const wrong = await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {
      pin: '1357',
    });

    expect(wrong.status).toBe(401);
    expect((await refusalIn(wrong)).code).toBe('error.profiles.thatPinIsWrong');
    expect(
      (await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, { pin: '2468' })).status,
    ).toBe(200);
  });

  it('stops tries after five wrong PINs', async () => {
    const context = build();
    const { cookie, kidId } = await aLockedKid(context);
    const statuses: number[] = [];

    for (let tries = 0; tries < 6; tries += 1) {
      statuses.push(
        (await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, { pin: '0000' }))
          .status,
      );
    }

    expect(statuses).toEqual([401, 401, 401, 401, 429, 429]);
    expect(
      (await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, { pin: '2468' })).status,
    ).toBe(429);
  });

  it('sets a new PIN with the account’s password, for somebody who forgot it', async () => {
    const context = build();
    const { cookie, kidId } = await aLockedKid(context);

    const chosen = await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {
      password: CREDENTIALS.password,
      newPin: '9753',
    });

    expect(chosen.status).toBe(200);

    const again = await anotherDevice(context);

    expect(
      (await ask(context, again, 'POST', `/api/profiles/${kidId}/choose`, { pin: '9753' })).status,
    ).toBe(200);
  });

  it('refuses the wrong password', async () => {
    const context = build();
    const { cookie, kidId } = await aLockedKid(context);

    const refused = await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {
      password: 'not-the-password',
      newPin: '9753',
    });

    expect(refused.status).toBe(401);
    expect((await refusalIn(refused)).code).toBe('common.thatIsNotYourPassword');
  });

  it('asks for a new PIN beside the password', async () => {
    const context = build();
    const { cookie, kidId } = await aLockedKid(context);

    expect(
      (
        await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {
          password: CREDENTIALS.password,
        })
      ).status,
    ).toBe(400);
  });
});

describe('the owner of an account that may do more than every profile', () => {
  /**
   * An administrator's household of an owner and a child, and a second device that has not
   * chosen yet.
   *
   * @param context - The application.
   * @returns The second device's cookie, the first's, and both profiles.
   */
  const anAdministratorsHousehold = async (context: Context) => {
    const household = await aHousehold(context);

    await makeAdministrator(context.permissions, household.accountId);

    return { ...household, first: household.cookie, cookie: await anotherDevice(context) };
  };

  it('chooses the owner without a PIN', async () => {
    const context = build();
    const { cookie, ownerId } = await anAdministratorsHousehold(context);

    expect((await ask(context, cookie, 'POST', `/api/profiles/${ownerId}/choose`, {})).status).toBe(
      200,
    );
  });

  it('holds none of the account’s role while watching as somebody else', async () => {
    const context = build();
    const { cookie, kidId } = await anAdministratorsHousehold(context);

    await ask(context, cookie, 'POST', `/api/profiles/${kidId}/choose`, {});

    const permissions = z
      .object({ permissions: z.array(z.string()) })
      .parse(await (await ask(context, cookie, 'GET', '/api/account/permissions')).json());

    expect(permissions.permissions).not.toContain('administrator');
  });
});
