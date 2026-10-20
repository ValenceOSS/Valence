import { countAffected } from '@ValenceDatabase/countAffected';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { eq } from 'drizzle-orm';
import { userProfile } from '#dialect/Schema';
import { drawAvatar, isAvatarStyle } from '@ValenceServer/profiles/drawAvatar';
import {
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { ProfileColourSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { HOUSEHOLD_LIMITS, householdPhotoName } from './HouseholdPicture';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { HouseholdRequest } from '@ValenceContracts/schemas/Household';
import type { Avatar } from '@ValenceContracts/schemas/ViewerProfile';
import type { HouseholdService } from './HouseholdService';

const MOVING_FORMATS = new Set(['.webm', '.mp4']);

const PHOTO_CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
};

type HouseholdRow = {
  displayName: string | null;
  colour: string | null;
  avatarStyle: string | null;
  avatarSeed: string | null;
  photoPath: string | null;
  onboardedAt: Date | null;
  updatedAt: Date;
};

const COLUMNS = {
  displayName: userProfile.displayName,
  colour: userProfile.colour,
  avatarStyle: userProfile.avatarStyle,
  avatarSeed: userProfile.avatarSeed,
  photoPath: userProfile.photoPath,
  onboardedAt: userProfile.onboardedAt,
  updatedAt: userProfile.updatedAt,
};

/**
 * Reads the picture a household chose for itself, from the columns that between them hold whichever
 * kind was chosen, or nothing where it chose none and so is drawn as its owner is.
 *
 * @param row - The household row as stored.
 * @returns Its own picture, or null where it has none.
 */
const readAvatarChoice = (row: HouseholdRow): Avatar | null => {
  if (row.photoPath !== null) {
    return { kind: 'photo', isVideo: MOVING_FORMATS.has(extname(row.photoPath)), frame: null };
  }

  if (row.avatarStyle !== null && row.avatarSeed !== null && isAvatarStyle(row.avatarStyle)) {
    return { kind: 'drawn', style: row.avatarStyle, seed: row.avatarSeed };
  }

  return null;
};

/**
 * Turns a chosen avatar into the columns that hold it, so that choosing one kind clears whatever
 * another kind left behind, and choosing none, or an initial, leaves the household drawn as its
 * owner is.
 *
 * @param avatar - What the household should be drawn with, or null for nothing of its own.
 * @returns The columns to write, or nothing where the picture is not being changed.
 */
const avatarColumns = (
  avatar: HouseholdRequest['avatar'],
): { avatarStyle: string | null; avatarSeed: string | null; photoPath: string | null } | null => {
  if (avatar === undefined || avatar?.kind === 'photo') {
    return null;
  }

  return avatar?.kind === 'drawn'
    ? { avatarStyle: avatar.style, avatarSeed: avatar.seed, photoPath: null }
    : { avatarStyle: null, avatarSeed: null, photoPath: null };
};

/**
 * The household as Postgres holds it: what it is called, what it is drawn with, and whether anybody
 * has finished setting it up.
 *
 * A household is an account, and `user_profile` is the row that has always described one — it simply
 * had nothing in it anybody read. This is the first thing to read it.
 *
 * @param db - The database to read and write.
 * @param pictureDirectory - Where uploaded household pictures are kept.
 * @returns The household store.
 */
const createDatabaseHouseholdService = (
  db: AnyValenceDatabase,
  pictureDirectory: string,
): HouseholdService => {
  const rowFor = async (userId: string): Promise<HouseholdRow | undefined> => {
    const rows = await db
      .select(COLUMNS)
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    return rows[0];
  };

  return {
    read: async (userId) => {
      const row = await rowFor(userId);

      if (row === undefined) {
        return { name: null, colour: null, avatar: null, updatedAt: new Date(0).toISOString() };
      }

      const name = row.displayName?.trim() ?? '';

      return {
        name: name === '' ? null : name,
        colour: ProfileColourSchema.nullable().catch(null).parse(row.colour),
        avatar: readAvatarChoice(row),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    isOnboarded: async (userId) => {
      const row = await rowFor(userId);

      return row !== undefined && row.onboardedAt !== null;
    },

    change: async (userId, request: HouseholdRequest) => {
      const chosen = avatarColumns(request.avatar);

      const changed = countAffected(
        await db
          .update(userProfile)
          .set({
            ...(request.name === undefined ? {} : { displayName: request.name }),
            ...(request.colour === undefined ? {} : { colour: request.colour }),
            ...chosen,
            updatedAt: new Date(),
          })
          .where(eq(userProfile.userId, userId)),
      );

      return changed > 0;
    },

    finishOnboarding: async (userId) => {
      const changed = countAffected(
        await db
          .update(userProfile)
          .set({ onboardedAt: new Date(), updatedAt: new Date() })
          .where(eq(userProfile.userId, userId)),
      );

      return changed > 0;
    },

    readAvatar: async (userId) => {
      const row = await rowFor(userId);

      if (row === undefined) {
        return null;
      }

      const choice = readAvatarChoice(row);

      if (choice?.kind === 'drawn') {
        return {
          body: new TextEncoder().encode(drawAvatar(choice.style, choice.seed)),
          contentType: 'image/svg+xml',
        };
      }

      if (choice?.kind === 'photo' && row.photoPath !== null) {
        const body = await readFile(join(pictureDirectory, row.photoPath)).catch(() => null);

        if (body !== null) {
          return {
            body,
            contentType: PHOTO_CONTENT_TYPES[extname(row.photoPath)] ?? 'image/jpeg',
          };
        }
      }

      return null;
    },

    savePhoto: async (userId, photo) => {
      const wrong = await whatIsWrongWithThePicture(photo, HOUSEHOLD_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      await mkdir(pictureDirectory, { recursive: true });

      const name = householdPhotoName(userId, extensionFor(photo.contentType) ?? '.png');

      await writeFile(join(pictureDirectory, name), photo.body);

      const changed = countAffected(
        await db
          .update(userProfile)
          .set({ photoPath: name, avatarStyle: null, avatarSeed: null, updatedAt: new Date() })
          .where(eq(userProfile.userId, userId)),
      );

      return changed > 0 ? null : 'notYours';
    },
  };
};

export { createDatabaseHouseholdService };
