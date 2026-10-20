import { randomUUID } from 'node:crypto';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { STILL_WATCHING_DEFAULT } from '@ValenceContracts/schemas/StillWatching';
import { drawAvatar, isAvatarStyle } from './drawAvatar';
import { whatIsWrongWithThePicture } from './whatIsWrongWithThePicture';
import type { ProfileService } from './ProfileService';
import type { Avatar, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';

type Held = {
  profile: ViewerProfile;
  userId: string;
  email: string;
  username?: string;
  photo: Uint8Array | null;
  pinHash?: string | null;
  pinFailures?: number;
  pinLockedUntil?: Date | null;
};

type MemoryState = Held[];

const DEFAULT_COLOUR = PROFILE_COLOURS[0];

let ticks = 0;

/**
 * Hands out timestamps that always differ and always increase, so that profiles made in the same
 * millisecond still sort in the order they were made. Only the in-memory service needs this; the
 * database has its own clock.
 *
 * @returns The next timestamp.
 */
const stamp = (): string => {
  ticks += 1;

  return new Date(ticks).toISOString();
};

/**
 * Profiles held in memory, so the routes can be exercised without Postgres.
 *
 * @param state - Any profiles that already exist.
 * @returns The profile service.
 */
const createMemoryProfileService = (
  state: MemoryState = [],
): ProfileService & { state: MemoryState } => {
  const listFor = (userId: string): ViewerProfile[] =>
    state
      .filter((held) => held.userId === userId)
      .map((held) => held.profile)
      .sort((left, right) => Number(right.isOwner) - Number(left.isOwner));

  const find = (profileId: string): Held | undefined =>
    state.find((held) => held.profile.id === profileId);

  const add = (userId: string, name: string, colour: string, avatar: Avatar): ViewerProfile => {
    const profile: ViewerProfile = {
      id: randomUUID(),
      name,
      colour: PROFILE_COLOURS.find((known) => known === colour) ?? DEFAULT_COLOUR,
      avatar,
      askStillWatchingAfter: STILL_WATCHING_DEFAULT,
      showsWhatIamWatching: false,
      discordPresence: DEFAULT_DISCORD_PRESENCE,
      prefersBestCopy: false,
      isOwner: listFor(userId).length === 0,
      hasPin: false,
      mayRequest: true,
      createdAt: stamp(),
      updatedAt: stamp(),
    };

    state.push({ profile, userId, email: `${userId}@valence.local`, photo: null });

    return profile;
  };

  return {
    state,

    list: (userId) => Promise.resolve(listFor(userId)),

    ensureDefault: (userId, name) => {
      const [existing] = listFor(userId);

      return Promise.resolve(
        existing ?? add(userId, name, DEFAULT_COLOUR, { kind: 'initial', font: 'gilroy' }),
      );
    },

    create: (userId, request) =>
      Promise.resolve(
        add(
          userId,
          request.name,
          request.colour,
          request.avatar ?? { kind: 'initial', font: 'gilroy' },
        ),
      ),

    rename: (userId, profileId, request) => {
      const held = find(profileId);

      if (held === undefined || held.userId !== userId) {
        return Promise.resolve(false);
      }

      held.profile = {
        ...held.profile,
        name: request.name,
        colour: request.colour,
        avatar: request.avatar ?? held.profile.avatar,
        askStillWatchingAfter: request.askStillWatchingAfter ?? held.profile.askStillWatchingAfter,
        showsWhatIamWatching: request.showsWhatIamWatching ?? held.profile.showsWhatIamWatching,
        discordPresence: request.discordPresence ?? held.profile.discordPresence,
        prefersBestCopy: request.prefersBestCopy ?? held.profile.prefersBestCopy,
        updatedAt: stamp(),
      };

      return Promise.resolve(true);
    },

    remove: (userId, profileId) => {
      if (listFor(userId).length <= 1) {
        return Promise.resolve(false);
      }

      const at = state.findIndex(
        (held) => held.profile.id === profileId && held.userId === userId && !held.profile.isOwner,
      );

      if (at === -1) {
        return Promise.resolve(false);
      }

      state.splice(at, 1);

      return Promise.resolve(true);
    },

    belongsTo: (userId, profileId) =>
      Promise.resolve(find(profileId)?.userId === userId && userId !== ''),

    moveTo: (profileId, newOwnerId) => {
      const held = find(profileId);

      if (held === undefined) {
        return Promise.resolve(false);
      }

      held.userId = newOwnerId;
      held.profile = { ...held.profile, isOwner: true, updatedAt: stamp() };

      return Promise.resolve(true);
    },

    readAvatar: (profileId) => {
      const held = find(profileId);

      if (held === undefined) {
        return Promise.resolve(null);
      }

      if (held.photo !== null) {
        return Promise.resolve({ body: held.photo, contentType: 'image/webp' });
      }

      const { avatar } = held.profile;

      if (avatar.kind !== 'drawn' || !isAvatarStyle(avatar.style)) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        body: new TextEncoder().encode(drawAvatar(avatar.style, avatar.seed)),
        contentType: 'image/svg+xml',
      });
    },

    listEveryone: () =>
      Promise.resolve(
        [...new Set(state.map((held) => held.userId))]
          .flatMap((userId) => listFor(userId).slice(0, 1))
          .sort((one, other) => one.name.localeCompare(other.name)),
      ),

    findSignIn: (profileId) => {
      const held = find(profileId);

      return Promise.resolve(
        held === undefined ? null : { email: held.email, username: held.username ?? null },
      );
    },

    accountOf: (profileId) => Promise.resolve(find(profileId)?.userId ?? null),

    standingOf: (profileId) => {
      const held = find(profileId);

      return Promise.resolve(
        held === undefined
          ? null
          : {
              id: held.profile.id,
              userId: held.userId,
              name: held.profile.name,
              isOwner: held.profile.isOwner,
              mayRequest: held.profile.mayRequest,
              pinHash: held.pinHash ?? null,
              pinFailures: held.pinFailures ?? 0,
              pinLockedUntil: held.pinLockedUntil ?? null,
            },
      );
    },

    setPin: (profileId, pinHash) => {
      const held = find(profileId);

      if (held !== undefined) {
        held.pinHash = pinHash;
        held.pinFailures = 0;
        held.pinLockedUntil = null;
        held.profile = { ...held.profile, hasPin: pinHash !== null, updatedAt: stamp() };
      }

      return Promise.resolve();
    },

    setPinTries: (profileId, failures, lockedUntil) => {
      const held = find(profileId);

      if (held !== undefined) {
        held.pinFailures = failures;
        held.pinLockedUntil = lockedUntil;
      }

      return Promise.resolve();
    },

    claimAPinTry: (profileId, at, lockFor) => {
      const held = find(profileId);

      if (held === undefined) {
        return Promise.resolve(null);
      }

      const lockedUntil = held.pinLockedUntil ?? null;

      if (lockedUntil !== null && lockedUntil.getTime() > at.getTime()) {
        return Promise.resolve({ kind: 'locked', until: lockedUntil });
      }

      const failures = (held.pinFailures ?? 0) + 1;

      held.pinFailures = failures;
      held.pinLockedUntil = lockFor(failures);

      return Promise.resolve({ kind: 'counted', failures, lockedUntil: held.pinLockedUntil });
    },

    setMayRequest: (profileId, mayRequest) => {
      const held = find(profileId);

      if (held !== undefined) {
        held.profile = { ...held.profile, mayRequest, updatedAt: stamp() };
      }

      return Promise.resolve();
    },

    handOver: (userId, profileId) => {
      if (find(profileId)?.userId !== userId) {
        return Promise.resolve(false);
      }

      for (const held of state.filter((one) => one.userId === userId)) {
        held.profile = { ...held.profile, isOwner: held.profile.id === profileId };
      }

      return Promise.resolve(true);
    },

    savePhoto: async (userId, profileId, photo) => {
      const held = find(profileId);

      if (held === undefined || held.userId !== userId) {
        return 'notYours';
      }

      const wrong = await whatIsWrongWithThePicture(photo);

      if (wrong !== null) {
        return wrong;
      }

      held.photo = photo.body;
      held.profile = {
        ...held.profile,
        avatar: { kind: 'photo', isVideo: false, frame: null },
        updatedAt: stamp(),
      };

      return null;
    },
  };
};

export type { MemoryState };

export { createMemoryProfileService };
