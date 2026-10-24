import { refuse } from '@ValenceI18n/refuse';
import { hashSecret } from '@ValenceServer/locks/hashSecret';
import { secretMatches } from '@ValenceServer/locks/secretMatches';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileLibrary } from '@ValenceContracts/schemas/ProfileLibraries';
import type { ChooseProfile } from '@ValenceContracts/schemas/ProfilePin';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { ChosenProfiles } from '@ValenceServer/profiles/ChosenProfiles';
import type { ProfileRequest, ProfileService } from '@ValenceServer/profiles/ProfileService';
import type { ProfileLimits } from '@ValenceServer/profiles/limits/ProfileLimits';
import type { Acting } from '@ValenceServer/profiles/acting/Acting';
import { lockAfter } from './lockAfter';
import type { ProfileAnswer } from './ProfileAnswer';
import type { ProfileManager } from './ProfileManager';

type ProfileManagementNeeds = {
  profiles: ProfileService;
  limits: ProfileLimits;
  chosen: ChosenProfiles;
  library: Pick<LibraryService, 'list' | 'refusedLibraries' | 'ceilingsFor'>;
  checkPassword: (accountId: string, password: string) => Promise<boolean>;
  announce: (accountId: string) => Promise<void>;
  onSecondProfile?: (accountId: string) => Promise<void>;
  onChosen?: (acting: Acting, profile: ViewerProfile, device: ChoosingDevice) => void;
  onPinLocked?: (accountId: string, profileName: string, failures: number) => void;
  onRemoved?: (profileId: string) => void;
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
   * Refuses somebody who tried too many wrong PINs, saying how long until they may try again.
   *
   * @param until - When tries may start again.
   * @returns The refusal.
   */
  const tooManyTries = (until: Date): Refusal =>
    refused(429, 'error.profiles.tooManyWrongPins', {
      minutes: Math.ceil((until.getTime() - now()) / 60_000),
    });

  /**
   * Counts a try at a profile's PIN or the account's password before checking it, so tries made at
   * once still each count, and stops tries for a while after every five wrong ones.
   *
   * @param standing - The profile, as it stands.
   * @param standing.id - Which profile.
   * @param standing.userId - Whose account it is on.
   * @param standing.name - What it is called.
   * @param isRight - Whether what was given is right.
   * @param wrongly - What to say where it is wrong and tries may go on.
   * @returns The refusal to answer with, or nothing where it was right.
   */
  const tryOnce = async (
    standing: { id: string; userId: string; name: string },
    isRight: () => boolean | Promise<boolean>,
    wrongly: 'error.profiles.thatPinIsWrong' | 'common.thatIsNotYourPassword',
  ): Promise<Refusal | null> => {
    const counted = await profiles.claimAPinTry(standing.id, new Date(now()), (failures) =>
      lockAfter(failures, now()),
    );

    if (counted === null) {
      return refused(404, 'error.common.noSuchProfileOnThisAccount');
    }

    if (counted.kind === 'locked') {
      return tooManyTries(counted.until);
    }

    if (await isRight()) {
      await profiles.setPinTries(standing.id, 0, null);

      return null;
    }

    if (counted.lockedUntil === null) {
      return refused(401, wrongly, {}, 'pin');
    }

    needs.onPinLocked?.(standing.userId, standing.name, counted.failures);

    return tooManyTries(counted.lockedUntil);
  };

  const listFor = async (accountId: string) => profiles.list(accountId);

  return {
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

      if (asked.password !== undefined) {
        const { password } = asked;

        if (asked.newPin === undefined) {
          return refused(400, 'error.profiles.chooseANewPin');
        }

        const refusal = await tryOnce(
          standing,
          () => needs.checkPassword(acting.account.id, password),
          'common.thatIsNotYourPassword',
        );

        if (refusal !== null) {
          return refusal;
        }

        await profiles.setPin(profileId, hashSecret(asked.newPin));
      } else if (standing.pinHash !== null) {
        const { pin } = asked;
        const { pinHash } = standing;

        if (pin === undefined) {
          return refused(401, 'error.profiles.enterThePin', {}, 'pin');
        }

        const refusal = await tryOnce(
          standing,
          () => secretMatches(pin, pinHash),
          'error.profiles.thatPinIsWrong',
        );

        if (refusal !== null) {
          return refusal;
        }
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
        const before = await profiles.list(manager.accountId);
        const created = await profiles.create(manager.accountId, request);

        if (before.length === 1) {
          await needs.onSecondProfile?.(manager.accountId);
        }

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

      needs.onRemoved?.(profileId);

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
