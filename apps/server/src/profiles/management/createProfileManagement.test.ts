import { describe, expect, it, vi } from 'vitest';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { secretMatches } from '@ValenceServer/locks/secretMatches';
import { createMemoryChosenProfiles } from '@ValenceServer/profiles/createMemoryChosenProfiles';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryProfileLimits } from '@ValenceServer/profiles/limits/createMemoryProfileLimits';
import type { Acting } from '@ValenceServer/profiles/acting/Acting';
import type { ProfileService } from '@ValenceServer/profiles/ProfileService';
import { createProfileManagement } from './createProfileManagement';
import type { ChoosingDevice } from './createProfileManagement';
import type { ProfileManager } from './ProfileManager';

const ACCOUNT = 'account-1';

const ELSEWHERE = 'account-2';

const PASSWORD = 'a-long-enough-password';

const NOW = Date.parse('2026-10-15T12:00:00.000Z');

const COLOUR = '#3ac47d';

const DEVICE: ChoosingDevice = { userAgent: 'Valence TV', brands: [], address: '192.0.2.1' };

const shelf = (id: string, name: string): Library => ({
  id,
  name,
  kind: 'movies',
  path: `/media/${id}`,
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

/**
 * A household of an owner and a child, beside somebody else's account, and everything that manages
 * their profiles.
 *
 * @param options - What profiles service to use instead.
 * @param options.wrap - Changes to make to the profile service before it is used.
 * @returns The management, the services behind it, the profiles, and what it told anybody.
 */
const aHousehold = async (
  options: {
    wrap?: (profiles: ProfileService) => ProfileService;
  } = {},
) => {
  const held = createMemoryProfileService();
  const owner = await held.ensureDefault(ACCOUNT, 'Dan');
  const kid = await held.create(ACCOUNT, { name: 'Kid', colour: COLOUR });
  const theirs = await held.ensureDefault(ELSEWHERE, 'Them');
  const profiles = options.wrap?.(held) ?? held;
  const limits = createMemoryProfileLimits();
  const chosen = createMemoryChosenProfiles();
  const library = createMemoryLibraryService({
    libraries: [shelf('films', 'Films'), shelf('shows', 'Shows'), shelf('kept', 'Kept')],
    media: [],
    blocked: [{ accountId: ACCOUNT, libraryId: 'kept' }],
    ceilings: [{ accountId: ACCOUNT, libraryId: 'films', maximumAge: 15, allowsUnrated: false }],
  });
  const clock = { now: NOW };
  const announced: string[] = [];
  const secondProfiles: string[] = [];
  const chosenFor: { acting: Acting; profile: ViewerProfile; device: ChoosingDevice }[] = [];
  const locked: { accountId: string; profileName: string; failures: number }[] = [];
  const checkPassword = vi
    .fn<(accountId: string, password: string) => Promise<boolean>>()
    .mockImplementation((accountId, password) =>
      Promise.resolve(accountId === ACCOUNT && password === PASSWORD),
    );

  const management = createProfileManagement({
    profiles,
    limits,
    chosen,
    library,
    checkPassword,
    announce: (accountId) => {
      announced.push(accountId);

      return Promise.resolve();
    },
    onSecondProfile: (accountId) => {
      secondProfiles.push(accountId);

      return Promise.resolve();
    },
    onChosen: (acting, profile, device) => {
      chosenFor.push({ acting, profile, device });
    },
    onPinLocked: (accountId, profileName, failures) => {
      locked.push({ accountId, profileName, failures });
    },
    now: () => clock.now,
  });

  const asOwner: ProfileManager = { kind: 'owner', accountId: ACCOUNT, profileId: owner.id };
  const asKid: ProfileManager = { kind: 'self', accountId: ACCOUNT, profileId: kid.id };
  const asAdministrator: ProfileManager = {
    kind: 'administrator',
    accountId: ACCOUNT,
    actorId: 'administrator',
  };
  const unchosen: Acting = {
    account: { id: ACCOUNT, name: 'Dan', email: 'dan@valence.local' },
    sessionId: 'session-1',
    isViaKey: false,
    profile: null,
    mustChoose: true,
  };

  return {
    management,
    profiles: held,
    limits,
    chosen,
    library,
    clock,
    announced,
    secondProfiles,
    chosenFor,
    locked,
    checkPassword,
    owner,
    kid,
    theirs,
    asOwner,
    asKid,
    asAdministrator,
    unchosen,
  };
};

const standing = async (household: Awaited<ReturnType<typeof aHousehold>>, profileId: string) =>
  household.profiles.standingOf(profileId);

describe('listing the profiles', () => {
  it('lists the account’s profiles and which one is chosen', async () => {
    const household = await aHousehold();

    const listed = await household.management.list(ACCOUNT, household.kid.id);

    expect(listed.chosenProfileId).toBe(household.kid.id);
    expect(listed.profiles.map((profile) => profile.name)).toEqual(['Dan', 'Kid']);
  });
});

describe('choosing who is watching', () => {
  it('chooses a profile with no PIN, and says so', async () => {
    const household = await aHousehold();

    const answer = await household.management.choose(
      household.unchosen,
      household.kid.id,
      {},
      DEVICE,
    );

    expect(answer).toMatchObject({ kind: 'done', body: { id: household.kid.id, name: 'Kid' } });
    await expect(household.chosen.chosenFor('session-1')).resolves.toBe(household.kid.id);
    expect(household.chosenFor).toHaveLength(1);
    expect(household.chosenFor[0]?.acting).toBe(household.unchosen);
    expect(household.chosenFor[0]?.profile.id).toBe(household.kid.id);
    expect(household.chosenFor[0]?.device).toBe(DEVICE);
  });

  it('will not let an API key choose, since a key acts for one profile', async () => {
    const household = await aHousehold();

    const answer = await household.management.choose(
      { ...household.unchosen, isViaKey: true },
      household.kid.id,
      {},
      DEVICE,
    );

    expect(answer).toMatchObject({
      kind: 'refused',
      status: 403,
      body: { code: 'error.profiles.aKeyActsForOneProfile' },
    });
    await expect(household.chosen.chosenFor('session-1')).resolves.toBeNull();
  });

  it('has no profile to choose on another account, or one that is not there', async () => {
    const household = await aHousehold();

    for (const profileId of [household.theirs.id, '3f2504e0-4f89-41d3-9a0c-0305e82c3301']) {
      expect(
        await household.management.choose(household.unchosen, profileId, {}, DEVICE),
      ).toMatchObject({
        kind: 'refused',
        status: 404,
        body: { code: 'error.common.noSuchProfileOnThisAccount' },
      });
    }

    expect(household.chosenFor).toEqual([]);
  });

  it('asks for the PIN of a profile that has one, without counting it as wrong', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    const answer = await household.management.choose(
      household.unchosen,
      household.kid.id,
      {},
      DEVICE,
    );

    expect(answer).toMatchObject({
      kind: 'refused',
      status: 401,
      body: { code: 'error.profiles.enterThePin', needs: 'pin' },
    });
    expect((await standing(household, household.kid.id))?.pinFailures).toBe(0);
    await expect(household.chosen.chosenFor('session-1')).resolves.toBeNull();
  });

  it('chooses a profile with its PIN', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    expect(
      await household.management.choose(
        household.unchosen,
        household.kid.id,
        { pin: '2468' },
        DEVICE,
      ),
    ).toMatchObject({ kind: 'done' });
    await expect(household.chosen.chosenFor('session-1')).resolves.toBe(household.kid.id);
  });

  it('counts a wrong PIN, and asks again', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    const answer = await household.management.choose(
      household.unchosen,
      household.kid.id,
      { pin: '1357' },
      DEVICE,
    );

    expect(answer).toMatchObject({
      kind: 'refused',
      status: 401,
      body: { code: 'error.profiles.thatPinIsWrong', needs: 'pin' },
    });
    expect(await standing(household, household.kid.id)).toMatchObject({
      pinFailures: 1,
      pinLockedUntil: null,
    });
    await expect(household.chosen.chosenFor('session-1')).resolves.toBeNull();
  });

  it('starts counting again once the right PIN is given', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');
    await household.management.choose(
      household.unchosen,
      household.kid.id,
      { pin: '1357' },
      DEVICE,
    );
    await household.management.choose(
      household.unchosen,
      household.kid.id,
      { pin: '2468' },
      DEVICE,
    );

    expect((await standing(household, household.kid.id))?.pinFailures).toBe(0);
  });

  it('stops tries for a minute after five wrong PINs, and tells the owner', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    const answers = [];

    for (let tries = 0; tries < 5; tries += 1) {
      answers.push(
        await household.management.choose(
          household.unchosen,
          household.kid.id,
          { pin: '0000' },
          DEVICE,
        ),
      );
    }

    expect(answers.map((answer) => (answer.kind === 'refused' ? answer.status : 200))).toEqual([
      401, 401, 401, 401, 429,
    ]);
    expect(answers[4]).toMatchObject({
      body: { code: 'error.profiles.tooManyWrongPins', values: { minutes: 1 } },
    });
    expect(household.locked).toEqual([{ accountId: ACCOUNT, profileName: 'Kid', failures: 5 }]);
    expect((await standing(household, household.kid.id))?.pinLockedUntil?.getTime()).toBe(
      NOW + 60_000,
    );
  });

  it('counts every one of many wrong PINs tried at once, so guessing in parallel still locks', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    const answers = await Promise.all(
      Array.from({ length: 50 }, () =>
        household.management.choose(household.unchosen, household.kid.id, { pin: '0000' }, DEVICE),
      ),
    );
    const statuses = answers.map((answer) => (answer.kind === 'refused' ? answer.status : 200));

    expect(statuses.filter((status) => status === 401)).toHaveLength(4);
    expect(statuses.filter((status) => status === 429)).toHaveLength(46);
    expect(household.locked).toEqual([{ accountId: ACCOUNT, profileName: 'Kid', failures: 5 }]);
  });

  it('refuses even the right PIN while tries are stopped, saying how long is left', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');
    await household.profiles.setPinTries(household.kid.id, 10, new Date(NOW + 5 * 60_000));
    household.clock.now = NOW + 61_000;

    const answer = await household.management.choose(
      household.unchosen,
      household.kid.id,
      { pin: '2468' },
      DEVICE,
    );

    expect(answer).toMatchObject({
      kind: 'refused',
      status: 429,
      body: { code: 'error.profiles.tooManyWrongPins', values: { minutes: 4 } },
    });
    expect((await standing(household, household.kid.id))?.pinFailures).toBe(10);
    await expect(household.chosen.chosenFor('session-1')).resolves.toBeNull();
  });

  it('lets tries go on once the lock has passed', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');
    await household.profiles.setPinTries(household.kid.id, 5, new Date(NOW));

    expect(
      await household.management.choose(
        household.unchosen,
        household.kid.id,
        { pin: '0000' },
        DEVICE,
      ),
    ).toMatchObject({ kind: 'refused', status: 401 });
    expect(
      await household.management.choose(
        household.unchosen,
        household.kid.id,
        { pin: '2468' },
        DEVICE,
      ),
    ).toMatchObject({ kind: 'done' });
    expect(await standing(household, household.kid.id)).toMatchObject({
      pinFailures: 0,
      pinLockedUntil: null,
    });
  });

  it('stops tries for longer after each five more wrong PINs', async () => {
    const household = await aHousehold();
    const minutesAfter = async (failuresBefore: number) => {
      await household.profiles.setPinTries(household.kid.id, failuresBefore, null);

      const answer = await household.management.choose(
        household.unchosen,
        household.kid.id,
        { pin: '0000' },
        DEVICE,
      );

      return answer.kind === 'refused' ? answer.body.values['minutes'] : null;
    };

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    expect([
      await minutesAfter(9),
      await minutesAfter(14),
      await minutesAfter(19),
      await minutesAfter(24),
    ]).toEqual([5, 15, 60, 60]);
    expect(household.locked.map((one) => one.failures)).toEqual([10, 15, 20, 25]);
  });

  it('asks no PIN of the owner of an account nobody else shares', async () => {
    const household = await aHousehold();

    await household.profiles.remove(ACCOUNT, household.kid.id);

    expect(
      await household.management.choose(household.unchosen, household.owner.id, {}, DEVICE),
    ).toMatchObject({ kind: 'done' });
  });

  it('asks no PIN of a profile that is not the owner', async () => {
    const household = await aHousehold();

    expect(
      await household.management.choose(household.unchosen, household.kid.id, {}, DEVICE),
    ).toMatchObject({ kind: 'done' });
  });

  it('lets the account’s password set a new PIN for a profile whose PIN was forgotten', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');
    await household.profiles.setPinTries(household.kid.id, 3, null);

    const answer = await household.management.choose(
      household.unchosen,
      household.kid.id,
      { password: PASSWORD, newPin: '9753' },
      DEVICE,
    );
    const kept = await standing(household, household.kid.id);

    expect(answer).toMatchObject({ kind: 'done' });
    expect(household.checkPassword).toHaveBeenCalledWith(ACCOUNT, PASSWORD);
    expect(secretMatches('9753', kept?.pinHash ?? '')).toBe(true);
    expect(kept?.pinFailures).toBe(0);
    await expect(household.chosen.chosenFor('session-1')).resolves.toBe(household.kid.id);
  });

  it('asks for a new PIN beside the password', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    const answer = await household.management.choose(
      household.unchosen,
      household.kid.id,
      { password: PASSWORD },
      DEVICE,
    );

    expect(answer).toMatchObject({
      kind: 'refused',
      status: 400,
      body: { code: 'error.profiles.chooseANewPin' },
    });
    expect(
      secretMatches('2468', (await standing(household, household.kid.id))?.pinHash ?? ''),
    ).toBe(true);
  });

  it('counts a wrong password as a wrong try', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    const answer = await household.management.choose(
      household.unchosen,
      household.kid.id,
      { password: 'not-the-password', newPin: '9753' },
      DEVICE,
    );

    expect(answer).toMatchObject({
      kind: 'refused',
      status: 401,
      body: { code: 'common.thatIsNotYourPassword', needs: 'pin' },
    });
    expect((await standing(household, household.kid.id))?.pinFailures).toBe(1);
    expect(
      secretMatches('2468', (await standing(household, household.kid.id))?.pinHash ?? ''),
    ).toBe(true);
  });

  it('will not take the password while tries are stopped', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');
    await household.profiles.setPinTries(household.kid.id, 5, new Date(NOW + 60_000));

    expect(
      await household.management.choose(
        household.unchosen,
        household.kid.id,
        { password: PASSWORD, newPin: '9753' },
        DEVICE,
      ),
    ).toMatchObject({ kind: 'refused', status: 429 });
    expect(household.checkPassword).not.toHaveBeenCalled();
  });

  it('forgets who was chosen, so somebody has to choose again', async () => {
    const household = await aHousehold();

    await household.management.choose(household.unchosen, household.kid.id, {}, DEVICE);
    await household.management.forget(household.unchosen);

    await expect(household.chosen.chosenFor('session-1')).resolves.toBeNull();
  });
});

describe('adding a profile', () => {
  it('adds one for the owner, and tells the account', async () => {
    const household = await aHousehold();

    const answer = await household.management.create(household.asOwner, {
      name: 'Sam',
      colour: COLOUR,
    });

    expect(answer).toMatchObject({ kind: 'done', body: { name: 'Sam', isOwner: false } });
    expect(household.announced).toEqual([ACCOUNT]);
    await expect(household.profiles.list(ACCOUNT)).resolves.toHaveLength(3);
    expect(household.secondProfiles).toEqual([]);
  });

  it('says so when an account one person watched on gains a second', async () => {
    const household = await aHousehold();

    await household.management.create(
      { kind: 'owner', accountId: ELSEWHERE, profileId: household.theirs.id },
      { name: 'Sam', colour: COLOUR },
    );

    expect(household.secondProfiles).toEqual([ELSEWHERE]);
  });

  it('adds one for an administrator', async () => {
    const household = await aHousehold();

    expect(
      await household.management.create(household.asAdministrator, { name: 'Sam', colour: COLOUR }),
    ).toMatchObject({ kind: 'done' });
  });

  it('will not add one for a profile that is not the owner', async () => {
    const household = await aHousehold();

    expect(
      await household.management.create(household.asKid, { name: 'Sam', colour: COLOUR }),
    ).toMatchObject({
      kind: 'refused',
      status: 403,
      body: { code: 'error.profiles.onlyTheOwnerCanDoThat' },
    });
    await expect(household.profiles.list(ACCOUNT)).resolves.toHaveLength(2);
    expect(household.announced).toEqual([]);
  });

  it('says a profile could not be added where the account cannot hold another', async () => {
    const household = await aHousehold({
      wrap: (profiles) => ({ ...profiles, create: () => Promise.reject(new Error('full')) }),
    });

    expect(
      await household.management.create(household.asOwner, { name: 'Sam', colour: COLOUR }),
    ).toMatchObject({
      kind: 'refused',
      status: 409,
      body: { code: 'server.profile.thatProfileCouldNotBeAdded' },
    });
    expect(household.announced).toEqual([]);
  });
});

describe('changing a profile', () => {
  it('lets a profile change itself', async () => {
    const household = await aHousehold();

    expect(
      await household.management.update(household.asKid, household.kid.id, {
        name: 'Big Kid',
        colour: COLOUR,
      }),
    ).toEqual({ kind: 'done', body: null });
    expect((await standing(household, household.kid.id))?.name).toBe('Big Kid');
    expect(household.announced).toEqual([ACCOUNT]);
  });

  it('will not let a profile change another', async () => {
    const household = await aHousehold();

    expect(
      await household.management.update(household.asKid, household.owner.id, {
        name: 'Mine now',
        colour: COLOUR,
      }),
    ).toMatchObject({ kind: 'refused', status: 403 });
    expect((await standing(household, household.owner.id))?.name).toBe('Dan');
  });

  it('lets the owner and an administrator change anybody on the account', async () => {
    const household = await aHousehold();

    for (const manager of [household.asOwner, household.asAdministrator]) {
      expect(
        await household.management.update(manager, household.kid.id, {
          name: manager.kind,
          colour: COLOUR,
        }),
      ).toMatchObject({ kind: 'done' });
    }

    expect((await standing(household, household.kid.id))?.name).toBe('administrator');
  });

  it('has nobody to change on another account', async () => {
    const household = await aHousehold();

    expect(
      await household.management.update(household.asOwner, household.theirs.id, {
        name: 'Mine now',
        colour: COLOUR,
      }),
    ).toMatchObject({
      kind: 'refused',
      status: 404,
      body: { code: 'error.common.noSuchProfileOnThisAccount' },
    });
    expect(household.announced).toEqual([]);
  });
});

describe('removing a profile', () => {
  it('removes somebody for the owner, and tells the account', async () => {
    const household = await aHousehold();

    expect(await household.management.remove(household.asOwner, household.kid.id)).toEqual({
      kind: 'done',
      body: null,
    });
    await expect(household.profiles.list(ACCOUNT)).resolves.toHaveLength(1);
    expect(household.announced).toEqual([ACCOUNT]);
  });

  it('removes somebody for an administrator', async () => {
    const household = await aHousehold();

    expect(
      await household.management.remove(household.asAdministrator, household.kid.id),
    ).toMatchObject({ kind: 'done' });
  });

  it('will not let a profile remove anybody, itself included', async () => {
    const household = await aHousehold();

    expect(await household.management.remove(household.asKid, household.kid.id)).toMatchObject({
      kind: 'refused',
      status: 403,
      body: { code: 'error.profiles.onlyTheOwnerCanDoThat' },
    });
    await expect(household.profiles.list(ACCOUNT)).resolves.toHaveLength(2);
  });

  it('never removes the owner’s profile, whoever asks', async () => {
    const household = await aHousehold();

    for (const manager of [household.asOwner, household.asAdministrator]) {
      expect(await household.management.remove(manager, household.owner.id)).toMatchObject({
        kind: 'refused',
        status: 409,
        body: { code: 'error.profiles.theOwnerProfileStays' },
      });
    }

    await expect(household.profiles.list(ACCOUNT)).resolves.toHaveLength(2);
  });

  it('has nobody to remove on another account', async () => {
    const household = await aHousehold();

    expect(await household.management.remove(household.asOwner, household.theirs.id)).toMatchObject(
      { kind: 'refused', status: 404, body: { code: 'error.common.noSuchProfileOnThisAccount' } },
    );
    await expect(household.profiles.list(ELSEWHERE)).resolves.toHaveLength(1);
  });

  it('says so where the profile could not be removed after all', async () => {
    const household = await aHousehold({
      wrap: (profiles) => ({ ...profiles, remove: () => Promise.resolve(false) }),
    });

    expect(await household.management.remove(household.asOwner, household.kid.id)).toMatchObject({
      kind: 'refused',
      status: 404,
      body: { code: 'error.profile.noSuchProfileOrItIs' },
    });
    expect(household.announced).toEqual([]);
  });
});

describe('setting a PIN', () => {
  it('lets a profile set its own, and keeps only a hash of it', async () => {
    const household = await aHousehold();

    expect(await household.management.setPin(household.asKid, household.kid.id, '2468')).toEqual({
      kind: 'done',
      body: null,
    });

    const kept = await standing(household, household.kid.id);

    expect(kept?.pinHash).not.toBe('2468');
    expect(secretMatches('2468', kept?.pinHash ?? '')).toBe(true);
    expect(household.announced).toEqual([ACCOUNT]);
  });

  it('will not let a profile set another’s', async () => {
    const household = await aHousehold();

    expect(
      await household.management.setPin(household.asKid, household.owner.id, '2468'),
    ).toMatchObject({ kind: 'refused', status: 403 });
    expect((await standing(household, household.owner.id))?.pinHash).toBeNull();
  });

  it('lets the owner and an administrator set anybody’s', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');
    await household.management.setPin(household.asAdministrator, household.owner.id, '1357');

    expect(
      secretMatches('2468', (await standing(household, household.kid.id))?.pinHash ?? ''),
    ).toBe(true);
    expect(
      secretMatches('1357', (await standing(household, household.owner.id))?.pinHash ?? ''),
    ).toBe(true);
  });

  it('takes a PIN away', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asKid, household.kid.id, '2468');
    await household.management.setPin(household.asKid, household.kid.id, null);

    expect((await standing(household, household.kid.id))?.pinHash).toBeNull();
  });

  it('lets the owner of a shared account take their PIN away', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.owner.id, '2468');

    expect(
      await household.management.setPin(household.asOwner, household.owner.id, null),
    ).toMatchObject({ kind: 'done' });
    expect((await standing(household, household.owner.id))?.pinHash).toBeNull();
  });

  it('lets an administrator clear the owner’s PIN, for somebody who forgot it', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.owner.id, '2468');

    expect(
      await household.management.setPin(household.asAdministrator, household.owner.id, null),
    ).toMatchObject({ kind: 'done' });
    expect((await standing(household, household.owner.id))?.pinHash).toBeNull();
  });

  it('lets the owner take away a PIN the account does not need', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.owner.id, '2468');

    expect(
      await household.management.setPin(household.asOwner, household.owner.id, null),
    ).toMatchObject({ kind: 'done' });
  });

  it('lets anybody else’s PIN go', async () => {
    const household = await aHousehold();

    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    expect(
      await household.management.setPin(household.asOwner, household.kid.id, null),
    ).toMatchObject({ kind: 'done' });
  });

  it('starts the count of wrong tries again with a new PIN', async () => {
    const household = await aHousehold();

    await household.profiles.setPinTries(household.kid.id, 5, new Date(NOW + 60_000));
    await household.management.setPin(household.asOwner, household.kid.id, '2468');

    expect(await standing(household, household.kid.id)).toMatchObject({
      pinFailures: 0,
      pinLockedUntil: null,
    });
  });

  it('has nobody to set a PIN for on another account', async () => {
    const household = await aHousehold();

    expect(
      await household.management.setPin(household.asOwner, household.theirs.id, '2468'),
    ).toMatchObject({ kind: 'refused', status: 404 });
    expect((await standing(household, household.theirs.id))?.pinHash).toBeNull();
  });
});

describe('letting a profile ask for things', () => {
  it('stops a profile asking, for the owner, and lets it again', async () => {
    const household = await aHousehold();

    expect(
      await household.management.setMayRequest(household.asOwner, household.kid.id, false),
    ).toEqual({ kind: 'done', body: null });
    expect((await standing(household, household.kid.id))?.mayRequest).toBe(false);

    await household.management.setMayRequest(household.asAdministrator, household.kid.id, true);

    expect((await standing(household, household.kid.id))?.mayRequest).toBe(true);
    expect(household.announced).toEqual([ACCOUNT, ACCOUNT]);
  });

  it('will not let a profile decide for itself', async () => {
    const household = await aHousehold();

    expect(
      await household.management.setMayRequest(household.asKid, household.kid.id, true),
    ).toMatchObject({ kind: 'refused', status: 403 });
  });

  it('has no limits to put on the owner', async () => {
    const household = await aHousehold();

    expect(
      await household.management.setMayRequest(household.asOwner, household.owner.id, false),
    ).toMatchObject({
      kind: 'refused',
      status: 409,
      body: { code: 'error.profiles.theOwnerHasNoLimits' },
    });
    expect((await standing(household, household.owner.id))?.mayRequest).toBe(true);
  });

  it('has nobody to limit on another account', async () => {
    const household = await aHousehold();

    expect(
      await household.management.setMayRequest(household.asOwner, household.theirs.id, false),
    ).toMatchObject({ kind: 'refused', status: 404 });
  });
});

describe('handing the account over', () => {
  it('makes another profile the owner, and the old owner one of the household', async () => {
    const household = await aHousehold();

    expect(await household.management.handOver(household.asOwner, household.kid.id)).toEqual({
      kind: 'done',
      body: null,
    });
    expect((await standing(household, household.kid.id))?.isOwner).toBe(true);
    expect((await standing(household, household.owner.id))?.isOwner).toBe(false);
    expect(household.announced).toEqual([ACCOUNT]);
  });

  it('lifts the new owner’s limits, since the owner watches everything the account reaches', async () => {
    const household = await aHousehold();

    await household.limits.refuseLibrary(household.kid.id, 'shows');
    await household.limits.setCeiling(household.kid.id, {
      libraryId: 'films',
      maximumAge: 12,
      allowsUnrated: true,
    });
    await household.profiles.setMayRequest(household.kid.id, false);
    await household.management.handOver(household.asOwner, household.kid.id);

    await expect(household.limits.refusedLibraries(household.kid.id)).resolves.toEqual([]);
    await expect(household.limits.ceilingsFor(household.kid.id)).resolves.toEqual([]);
    expect((await standing(household, household.kid.id))?.mayRequest).toBe(true);
  });

  it('hands it over for an administrator', async () => {
    const household = await aHousehold();

    expect(
      await household.management.handOver(household.asAdministrator, household.kid.id),
    ).toMatchObject({ kind: 'done' });
  });

  it('will not let a profile take the account for itself', async () => {
    const household = await aHousehold();

    expect(await household.management.handOver(household.asKid, household.kid.id)).toMatchObject({
      kind: 'refused',
      status: 403,
    });
    expect((await standing(household, household.kid.id))?.isOwner).toBe(false);
  });

  it('will not hand the account to a profile on another account', async () => {
    const household = await aHousehold();

    expect(
      await household.management.handOver(household.asOwner, household.theirs.id),
    ).toMatchObject({ kind: 'refused', status: 404 });
    expect((await standing(household, household.owner.id))?.isOwner).toBe(true);
  });
});

describe('what a profile may watch', () => {
  it('lists every library the account reaches, with the profile’s limits in each', async () => {
    const household = await aHousehold();

    await household.limits.refuseLibrary(household.kid.id, 'shows');
    await household.limits.setCeiling(household.kid.id, {
      libraryId: 'films',
      maximumAge: 12,
      allowsUnrated: true,
    });

    expect(await household.management.libraries(household.asOwner, household.kid.id)).toEqual({
      kind: 'done',
      body: {
        libraries: [
          {
            id: 'films',
            name: 'Films',
            mayView: true,
            maximumAge: 12,
            allowsUnrated: true,
            accountMaximumAge: 15,
          },
          {
            id: 'shows',
            name: 'Shows',
            mayView: false,
            maximumAge: null,
            allowsUnrated: false,
            accountMaximumAge: null,
          },
        ],
      },
    });
  });

  it('shows an administrator the same', async () => {
    const household = await aHousehold();

    expect(
      await household.management.libraries(household.asAdministrator, household.kid.id),
    ).toMatchObject({ kind: 'done' });
  });

  it('is for the owner, not the profile itself', async () => {
    const household = await aHousehold();

    expect(await household.management.libraries(household.asKid, household.kid.id)).toMatchObject({
      kind: 'refused',
      status: 403,
    });
  });

  it('has nobody to describe on another account', async () => {
    const household = await aHousehold();

    expect(
      await household.management.libraries(household.asOwner, household.theirs.id),
    ).toMatchObject({ kind: 'refused', status: 404 });
  });
});

describe('narrowing what a profile may watch', () => {
  it('keeps a profile out of a library, and lets it back', async () => {
    const household = await aHousehold();

    expect(
      await household.management.limitLibrary(household.asOwner, household.kid.id, 'films', {
        kind: 'refuse',
      }),
    ).toEqual({ kind: 'done', body: null });
    await expect(household.limits.refusedLibraries(household.kid.id)).resolves.toEqual(['films']);

    await household.management.limitLibrary(household.asOwner, household.kid.id, 'films', {
      kind: 'allow',
    });

    await expect(household.limits.refusedLibraries(household.kid.id)).resolves.toEqual([]);
  });

  it('caps the age of what a profile sees in a library, and lifts it', async () => {
    const household = await aHousehold();

    await household.management.limitLibrary(household.asAdministrator, household.kid.id, 'films', {
      kind: 'ceiling',
      maximumAge: 12,
      allowsUnrated: false,
    });

    await expect(household.limits.ceilingsFor(household.kid.id)).resolves.toEqual([
      { libraryId: 'films', maximumAge: 12, allowsUnrated: false },
    ]);

    await household.management.limitLibrary(household.asOwner, household.kid.id, 'films', {
      kind: 'noCeiling',
    });

    await expect(household.limits.ceilingsFor(household.kid.id)).resolves.toEqual([]);
  });

  it('will not let a profile narrow or widen itself', async () => {
    const household = await aHousehold();

    await household.limits.refuseLibrary(household.kid.id, 'films');

    expect(
      await household.management.limitLibrary(household.asKid, household.kid.id, 'films', {
        kind: 'allow',
      }),
    ).toMatchObject({ kind: 'refused', status: 403 });
    await expect(household.limits.refusedLibraries(household.kid.id)).resolves.toEqual(['films']);
  });

  it('has no limits to put on the owner', async () => {
    const household = await aHousehold();

    for (const manager of [household.asOwner, household.asAdministrator]) {
      expect(
        await household.management.limitLibrary(manager, household.owner.id, 'films', {
          kind: 'refuse',
        }),
      ).toMatchObject({
        kind: 'refused',
        status: 409,
        body: { code: 'error.profiles.theOwnerHasNoLimits' },
      });
    }

    await expect(household.limits.refusedLibraries(household.owner.id)).resolves.toEqual([]);
  });

  it('has no library the account cannot reach, or one that is not there', async () => {
    const household = await aHousehold();

    for (const libraryId of ['kept', 'nowhere']) {
      expect(
        await household.management.limitLibrary(household.asOwner, household.kid.id, libraryId, {
          kind: 'refuse',
        }),
      ).toMatchObject({
        kind: 'refused',
        status: 404,
        body: { code: 'error.common.noSuchLibrary' },
      });
    }

    await expect(household.limits.refusedLibraries(household.kid.id)).resolves.toEqual([]);
  });

  it('has nobody to narrow on another account', async () => {
    const household = await aHousehold();

    expect(
      await household.management.limitLibrary(household.asOwner, household.theirs.id, 'films', {
        kind: 'refuse',
      }),
    ).toMatchObject({ kind: 'refused', status: 404 });
    await expect(household.limits.refusedLibraries(household.theirs.id)).resolves.toEqual([]);
  });
});
