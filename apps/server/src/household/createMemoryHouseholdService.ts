import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { whatIsWrongWithThePicture } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { HOUSEHOLD_LIMITS } from './HouseholdPicture';
import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { HouseholdService } from './HouseholdService';

type Held = {
  name: string | null;
  colour: ProfileColour;
  avatar: Avatar;
  updatedAt: string;
  onboardedAt: string | null;
  picture: Uint8Array | null;
};

type MemoryState = Record<string, Held>;

const [DEFAULT_COLOUR] = PROFILE_COLOURS;

/**
 * The household store held in memory, for tests that need one without a database.
 *
 * A row exists for every account from the moment it is created, which is what the database does,
 * so this makes one on first sight rather than refusing anything that arrives before a read. A name
 * is held as absent until somebody chooses one, and the account's own name stands in — again what
 * the database does, since a test passing against stricter rules would describe a server that does
 * not exist.
 *
 * @param state - What it starts out holding, by account.
 * @returns The store, plus the state so a test can read what it wrote.
 */
const createMemoryHouseholdService = (
  state: MemoryState = {},
): HouseholdService & { state: MemoryState } => {
  const held = (userId: string): Held => {
    const already = state[userId];

    if (already !== undefined) {
      return already;
    }

    const made: Held = {
      name: null,
      colour: DEFAULT_COLOUR,
      avatar: { kind: 'initial', font: 'gilroy' },
      updatedAt: new Date().toISOString(),
      onboardedAt: null,
      picture: null,
    };

    state[userId] = made;

    return made;
  };

  return {
    state,

    read: (userId, fallbackName) => {
      const one = held(userId);

      return Promise.resolve({
        name: one.name ?? fallbackName,
        colour: one.colour,
        avatar: one.avatar,
        updatedAt: one.updatedAt,
      });
    },

    isOnboarded: (userId) => Promise.resolve(held(userId).onboardedAt !== null),

    change: (userId, request) => {
      const one = held(userId);

      if (request.name !== undefined) {
        one.name = request.name;
      }

      if (request.colour !== undefined) {
        one.colour = request.colour;
      }

      if (request.avatar !== undefined) {
        one.avatar = request.avatar;
      }

      one.updatedAt = new Date().toISOString();

      return Promise.resolve(true);
    },

    finishOnboarding: (userId) => {
      held(userId).onboardedAt = new Date().toISOString();

      return Promise.resolve(true);
    },

    readAvatar: (userId) => {
      const picture = held(userId).picture;

      return Promise.resolve(picture === null ? null : { body: picture, contentType: 'image/png' });
    },

    savePhoto: async (userId, photo) => {
      const wrong = await whatIsWrongWithThePicture(photo, HOUSEHOLD_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      const one = held(userId);

      one.picture = photo.body;
      one.avatar = { kind: 'photo', isVideo: false, frame: null };
      one.updatedAt = new Date().toISOString();

      return null;
    },
  };
};

export type { MemoryState };

export { createMemoryHouseholdService };
