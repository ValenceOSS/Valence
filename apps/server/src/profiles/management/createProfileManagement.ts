import { refuse } from '@ValenceI18n/refuse';
import { hashSecret } from '@ValenceServer/locks/hashSecret';
import { secretMatches } from '@ValenceServer/locks/secretMatches';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileLibrary } from '@ValenceContracts/schemas/ProfileLibraries';
import type { ChooseProfile } from '@ValenceContracts/schemas/ProfilePin';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { ChosenProfiles } from '@ValenceServer/profiles/ChosenProfiles';
import type { ProfileRequest, ProfileService } from '@ValenceServer/profiles/ProfileService';
import type { ProfileLimits } from '@ValenceServer/profiles/limits/ProfileLimits';
import type { Acting } from '@ValenceServer/profiles/acting/Acting';
import { holdsMoreThanEveryProfile } from '@ValenceContracts/functions/holdsMoreThanEveryProfile';
import { lockAfter } from './lockAfter';
import type { ProfileAnswer } from './ProfileAnswer';
import type { ProfileManager } from './ProfileManager';

type ProfileManagementNeeds = {
  profiles: ProfileService;
  limits: ProfileLimits;
  chosen: ChosenProfiles;
  library: Pick<LibraryService, 'list' | 'refusedLibraries' | 'ceilingsFor'>;
  resolve: (accountId: string) => Promise<ReadonlySet<GrantedPermission>>;
  checkPassword: (accountId: string, password: string) => Promise<boolean>;
  announce: (accountId: string) => Promise<void>;
  onChosen?: (acting: Acting, profile: ViewerProfile, device: ChoosingDevice) => void;
  onPinLocked?: (accountId: string, profileName: string, failures: number) => void;
  now?: () => number;
};

type ChoosingDevice = {
  userAgent: string | null;
  brands: readonly string[];
  address: string | null;
};

type Refusal = Extract<ProfileAnswer<never>, { kind: 'refused' }>;

/**
 * A refusal with its status, said by its handler.
 *
 * @param status - The status to answer with.
 * @param key - Which words.
 * @returns The refusal.
 */
const refused = (
  status: Refusal['status'],
  key: Parameters<typeof refuse>[0],
  values: Parameters<typeof refuse>[1] = {},
  needs?: 'pin' | 'newPin',
): Refusal => ({
  kind: 'refused',
  status,
  body: { ...refuse(key, values), ...(needs === undefined ? {} : { needs }) },
});

/**
 * Everything that can be done to the profiles on an account — choosing one, changing, removing and
 * locking them, handing over ownership and narrowing what each may watch — with the rules for who
 * may do which in one place, whether the owner, a profile acting for itself or an administrator is
 * asking.
 *
 * @param needs - The services it reads and writes.
 * @returns The actions.
 */
const createProfileManagement = (needs: ProfileManagementNeeds) => {
  const { profiles, limits, chosen, library } = needs;
  const now = needs.now ?? Date.now;

  /**
   * Whether an account's owner profile must have a PIN: once somebody else shares the account, if
   * the account may do more than every profile may anyway.
   *
   * @param accountId - Whose account.
   * @returns Whether its owner needs one.
   */
  const ownerNeedsAPin = async (accountId: string): Promise<boolean> =>
    (await profiles.list(accountId)).length > 1 &&
    holdsMoreThanEveryProfile(await needs.resolve(accountId));

  /**
   * Finds a profile on an account, or the refusal to answer with where it is not there.
   *
   * @param accountId - Whose account.
   * @param profileId - Which profile.
   * @returns The profile, or the refusal.
   */
  const findOn = async (accountId: string, profileId: string) => {
    const standing = await profiles.standingOf(profileId);

    return standing === null || standing.userId !== accountId
      ? refused(404, 'error.common.noSuchProfileOnThisAccount')
      : standing;
  };

  /**
   * Refuses a profile acting on anybody but itself, where only the owner or an administrator may.
   *
   * @param manager - Who is asking.
   * @param profileId - Which profile they are acting on.
   * @returns The refusal, or nothing where they may.
   */
  const onlyItselfOrTheOwner = (manager: ProfileManager, profileId: string): Refusal | null =>
    manager.kind === 'self' && manager.profileId !== profileId
      ? refused(403, 'error.profiles.onlyTheOwnerCanDoThat')
      : null;

  /**
   * Refuses anybody but the owner or an administrator.
   *
   * @param manager - Who is asking.
   * @returns The refusal, or nothing where they may.
   */
  const onlyTheOwner = (manager: ProfileManager): Refusal | null =>
    manager.kind === 'self' ? refused(403, 'error.profiles.onlyTheOwnerCanDoThat') : null;

  /**
   * Counts a wrong PIN or password against a profile, stopping tries for a while after every five.
   *
   * @param standing - The profile, as it stands.
   * @param standing.id - Which profile.
   * @param standing.userId - Whose account it is on.
   * @param standing.name - What it is called.
   * @param standing.pinFailures - How many wrong tries came before this one.
   * @param wrongly - What to say while tries may go on.
   * @returns The refusal to answer with.
   */
  const countAWrongTry = async (
    standing: { id: string; userId: string; name: string; pinFailures: number },
    wrongly: 'error.profiles.thatPinIsWrong' | 'common.thatIsNotYourPassword',
  ): Promise<Refusal> => {
    const failures = standing.pinFailures + 1;
    const lockedUntil = lockAfter(failures, now());

    await profiles.setPinTries(standing.id, failures, lockedUntil);

    if (lockedUntil === null) {
      return refused(401, wrongly, {}, 'pin');
    }

    needs.onPinLocked?.(standing.userId, standing.name, failures);

    return refused(429, 'error.profiles.tooManyWrongPins', {
      minutes: Math.ceil((lockedUntil.getTime() - now()) / 60_000),
    });
  };

  const listFor = async (accountId: string) => profiles.list(accountId);

  return {
    ownerNeedsAPin,

    list: async (accountId: string, chosenProfileId: string | null) => ({
      profiles: await listFor(accountId),
      chosenProfileId,
    }),

    choose: async (
      acting: Acting,
      profileId: string,
      asked: ChooseProfile & { password?: string | undefined },
      device: ChoosingDevice,
    ): Promise<ProfileAnswer<ViewerProfile>> => {
      if (acting.isViaKey) {
        return refused(403, 'error.profiles.aKeyActsForOneProfile');
      }

      const standing = await findOn(acting.account.id, profileId);

      if ('kind' in standing) {
        return standing;
      }

      if (standing.pinLockedUntil !== null && standing.pinLockedUntil.getTime() > now()) {
        return refused(429, 'error.profiles.tooManyWrongPins', {
          minutes: Math.ceil((standing.pinLockedUntil.getTime() - now()) / 60_000),
        });
      }

      if (asked.password !== undefined) {
        if (!(await needs.checkPassword(acting.account.id, asked.password))) {
          return countAWrongTry(standing, 'common.thatIsNotYourPassword');
        }

        if (asked.newPin === undefined) {
          return refused(400, 'error.profiles.chooseANewPin');
        }

        await profiles.setPin(profileId, hashSecret(asked.newPin));
      } else if (standing.pinHash !== null) {
        if (asked.pin === undefined || !secretMatches(asked.pin, standing.pinHash)) {
          return asked.pin === undefined
            ? refused(401, 'error.profiles.enterThePin', {}, 'pin')
            : countAWrongTry(standing, 'error.profiles.thatPinIsWrong');
        }

        if (standing.pinFailures > 0) {
          await profiles.setPinTries(profileId, 0, null);
        }
      } else if (standing.isOwner && (await ownerNeedsAPin(acting.account.id))) {
        if (asked.newPin === undefined) {
          return refused(409, 'error.profiles.theOwnerNeedsAPin', {}, 'newPin');
        }

        await profiles.setPin(profileId, hashSecret(asked.newPin));
      }

      await chosen.choose(acting.sessionId, profileId);

      const profile = (await listFor(acting.account.id)).find((one) => one.id === profileId);

      if (profile === undefined) {
        return refused(404, 'error.common.noSuchProfileOnThisAccount');
      }

      needs.onChosen?.(acting, profile, device);

      return { kind: 'done', body: profile };
    },

    forget: async (acting: Acting): Promise<void> => {
      await chosen.forget(acting.sessionId);
    },

    create: async (
      manager: ProfileManager,
      request: ProfileRequest,
    ): Promise<ProfileAnswer<ViewerProfile>> => {
      const refusal = onlyTheOwner(manager);

      if (refusal !== null) {
        return refusal;
      }

      try {
        const created = await profiles.create(manager.accountId, request);

        await needs.announce(manager.accountId);

        return { kind: 'done', body: created };
      } catch {
        return refused(409, 'server.profile.thatProfileCouldNotBeAdded');
      }
    },

    update: async (
      manager: ProfileManager,
      profileId: string,
      request: ProfileRequest,
    ): Promise<ProfileAnswer<null>> => {
      const refusal = onlyItselfOrTheOwner(manager, profileId);

      if (refusal !== null) {
        return refusal;
      }

      if (!(await profiles.rename(manager.accountId, profileId, request))) {
        return refused(404, 'error.common.noSuchProfileOnThisAccount');
      }

      await needs.announce(manager.accountId);

      return { kind: 'done', body: null };
    },

    remove: async (manager: ProfileManager, profileId: string): Promise<ProfileAnswer<null>> => {
      const refusal = onlyTheOwner(manager);

      if (refusal !== null) {
        return refusal;
      }

      const standing = await findOn(manager.accountId, profileId);

      if ('kind' in standing) {
        return standing;
      }

      if (standing.isOwner) {
        return refused(409, 'error.profiles.theOwnerProfileStays');
      }

      if (!(await profiles.remove(manager.accountId, profileId))) {
        return refused(404, 'error.profile.noSuchProfileOrItIs');
      }

      await needs.announce(manager.accountId);

      return { kind: 'done', body: null };
    },

    setPin: async (
      manager: ProfileManager,
      profileId: string,
      pin: string | null,
    ): Promise<ProfileAnswer<null>> => {
      const refusal = onlyItselfOrTheOwner(manager, profileId);

      if (refusal !== null) {
        return refusal;
      }

      const standing = await findOn(manager.accountId, profileId);

      if ('kind' in standing) {
        return standing;
      }

      if (
        pin === null &&
        standing.isOwner &&
        manager.kind !== 'administrator' &&
        (await ownerNeedsAPin(manager.accountId))
      ) {
        return refused(409, 'error.profiles.theOwnerNeedsAPin');
      }

      await profiles.setPin(profileId, pin === null ? null : hashSecret(pin));
      await needs.announce(manager.accountId);

      return { kind: 'done', body: null };
    },

    setMayRequest: async (
      manager: ProfileManager,
      profileId: string,
      mayRequest: boolean,
    ): Promise<ProfileAnswer<null>> => {
      const refusal = onlyTheOwner(manager);

      if (refusal !== null) {
        return refusal;
      }

      const standing = await findOn(manager.accountId, profileId);

      if ('kind' in standing) {
        return standing;
      }

      if (standing.isOwner) {
        return refused(409, 'error.profiles.theOwnerHasNoLimits');
      }

      await profiles.setMayRequest(profileId, mayRequest);
      await needs.announce(manager.accountId);

      return { kind: 'done', body: null };
    },

    handOver: async (manager: ProfileManager, profileId: string): Promise<ProfileAnswer<null>> => {
      const refusal = onlyTheOwner(manager);

      if (refusal !== null) {
        return refusal;
      }

      if (!(await profiles.handOver(manager.accountId, profileId))) {
        return refused(404, 'error.common.noSuchProfileOnThisAccount');
      }

      const [refusedLibraries, ceilings] = await Promise.all([
        limits.refusedLibraries(profileId),
        limits.ceilingsFor(profileId),
      ]);

      await Promise.all([
        ...refusedLibraries.map((libraryId) => limits.allowLibrary(profileId, libraryId)),
        ...ceilings.map((ceiling) => limits.clearCeiling(profileId, ceiling.libraryId)),
        profiles.setMayRequest(profileId, true),
      ]);

      await needs.announce(manager.accountId);

      return { kind: 'done', body: null };
    },

    libraries: async (
      manager: ProfileManager,
      profileId: string,
    ): Promise<ProfileAnswer<{ libraries: ProfileLibrary[] }>> => {
      const refusal = onlyTheOwner(manager);

      if (refusal !== null) {
        return refusal;
      }

      const standing = await findOn(manager.accountId, profileId);

      if ('kind' in standing) {
        return standing;
      }

      const [shelves, accountRefused, accountCeilings, profileRefused, profileCeilings] =
        await Promise.all([
          library.list(asTheServer),
          library.refusedLibraries(manager.accountId),
          library.ceilingsFor(manager.accountId),
          limits.refusedLibraries(profileId),
          limits.ceilingsFor(profileId),
        ]);

      return {
        kind: 'done',
        body: {
          libraries: shelves
            .filter((shelf) => !accountRefused.includes(shelf.id))
            .map((shelf) => {
              const ceiling = profileCeilings.find((one) => one.libraryId === shelf.id);

              return {
                id: shelf.id,
                name: shelf.name,
                mayView: !profileRefused.includes(shelf.id),
                maximumAge: ceiling?.maximumAge ?? null,
                allowsUnrated: ceiling?.allowsUnrated ?? false,
                accountMaximumAge:
                  accountCeilings.find((one) => one.libraryId === shelf.id)?.maximumAge ?? null,
              };
            }),
        },
      };
    },

    limitLibrary: async (
      manager: ProfileManager,
      profileId: string,
      libraryId: string,
      change:
        | { kind: 'allow' }
        | { kind: 'refuse' }
        | { kind: 'ceiling'; maximumAge: number; allowsUnrated: boolean }
        | { kind: 'noCeiling' },
    ): Promise<ProfileAnswer<null>> => {
      const refusal = onlyTheOwner(manager);

      if (refusal !== null) {
        return refusal;
      }

      const standing = await findOn(manager.accountId, profileId);

      if ('kind' in standing) {
        return standing;
      }

      if (standing.isOwner) {
        return refused(409, 'error.profiles.theOwnerHasNoLimits');
      }

      const reachable = (await library.list(asTheServer)).some((shelf) => shelf.id === libraryId);

      if (!reachable || (await library.refusedLibraries(manager.accountId)).includes(libraryId)) {
        return refused(404, 'error.common.noSuchLibrary');
      }

      switch (change.kind) {
        case 'allow':
          await limits.allowLibrary(profileId, libraryId);
          break;
        case 'refuse':
          await limits.refuseLibrary(profileId, libraryId);
          break;
        case 'ceiling':
          await limits.setCeiling(profileId, {
            libraryId,
            maximumAge: change.maximumAge,
            allowsUnrated: change.allowsUnrated,
          });
          break;
        case 'noCeiling':
          await limits.clearCeiling(profileId, libraryId);
          break;
      }

      return { kind: 'done', body: null };
    },
  };
};

type ProfileManagement = ReturnType<typeof createProfileManagement>;

export type { ChoosingDevice, ProfileManagement, ProfileManagementNeeds };

export { createProfileManagement };
