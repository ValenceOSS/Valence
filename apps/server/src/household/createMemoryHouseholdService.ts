import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { whatIsWrongWithThePicture } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { HOUSEHOLD_LIMITS } from './HouseholdPicture';
import type { Household } from '@ValenceContracts/schemas/Household';
import type { HouseholdService } from './HouseholdService';

type Held = {
  household: Household;
  onboardedAt: string | null;
  picture: Uint8Array | null;
};

type MemoryState = Record<string, Held>;

const [DEFAULT_COLOUR] = PROFILE_COLOURS;

/**
 * The household store held in memory, for tests that need one without a database.
 *
 * @param state - What it starts out holding, by account.
 * @returns The store, plus the state so a test can read what it wrote.
 */
const createMemoryHouseholdService = (
  state: MemoryState = {},
): HouseholdService & { state: MemoryState } => {
  const held = (userId: string, fallbackName: string): Held => {
    const already = state[userId];

    if (already !== undefined) {
      return already;
    }

    const made: Held = {
      household: {
        name: fallbackName,
        colour: DEFAULT_COLOUR,
        avatar: { kind: 'initial' },
        updatedAt: new Date().toISOString(),
      },
      onboardedAt: null,
      picture: null,
    };

    state[userId] = made;

    return made;
  };

  return {
    state,

    read: (userId, fallbackName) => Promise.resolve(held(userId, fallbackName).household),

    isOnboarded: (userId) => Promise.resolve(state[userId]?.onboardedAt !== null),

    change: (userId, request) => {
      const one = state[userId];

      if (one === undefined) {
        return Promise.resolve(false);
      }

      one.household = {
        ...one.household,
        ...(request.name === undefined ? {} : { name: request.name }),
        ...(request.colour === undefined ? {} : { colour: request.colour }),
        ...(request.avatar === undefined ? {} : { avatar: request.avatar }),
        updatedAt: new Date().toISOString(),
      };

      return Promise.resolve(true);
    },

    finishOnboarding: (userId) => {
      const one = state[userId];

      if (one === undefined) {
        return Promise.resolve(false);
      }

      one.onboardedAt = new Date().toISOString();

      return Promise.resolve(true);
    },

    readAvatar: (userId) => {
      const picture = state[userId]?.picture ?? null;

      return Promise.resolve(picture === null ? null : { body: picture, contentType: 'image/png' });
    },

    savePhoto: async (userId, photo) => {
      const one = state[userId];

      if (one === undefined) {
        return 'notYours';
      }

      const wrong = await whatIsWrongWithThePicture(photo, HOUSEHOLD_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      one.picture = photo.body;
      one.household = {
        ...one.household,
        avatar: { kind: 'photo', isVideo: false },
        updatedAt: new Date().toISOString(),
      };

      return null;
    },
  };
};

export type { MemoryState };

export { createMemoryHouseholdService };
