import { say } from '@ValenceI18n/say';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { and, asc, eq } from 'drizzle-orm';
import { drawAvatar, isAvatarStyle } from './drawAvatar';
import { extensionFor, whatIsWrongWithThePicture } from './whatIsWrongWithThePicture';
import { pickOneFaceEach } from './pickOneFaceEach';
import { pickTheAccountsFace } from './pickTheAccountsFace';
import { viewerProfile, user, userProfile } from '@ValenceServer/db/Schema';
import { dropPrivatePlaylistsOf } from '@ValenceServer/playlists/dropPrivatePlaylistsOf';
import {
  STILL_WATCHING_DEFAULT,
  StillWatchingSchema,
} from '@ValenceContracts/schemas/StillWatching';
import { ProfileColourSchema, PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { ProfileService } from './ProfileService';
import type { ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { StoredFace } from './pickTheAccountsFace';

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

const [DEFAULT_COLOUR] = PROFILE_COLOURS;

const LIMIT = 6;

type ProfileRow = {
  id: string;
  name: string;
  colour: string;
  avatarStyle: string | null;
  avatarSeed: string | null;
  photoPath: string | null;
  askStillWatchingAfter: number;
  showsWhatIamWatching: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Reads a profile's colour from what is stored, falling back to the default rather than failing —
 * a colour written by an older version should leave a profile plain, not unreadable.
 *
 * @param stored - The colour column as stored.
 * @returns The colour to draw with.
 */
const readColour = (stored: string): ProfileColour => {
  const parsed = ProfileColourSchema.safeParse(stored);

  return parsed.success ? parsed.data : DEFAULT_COLOUR;
};

/**
 * Reads what a profile is drawn with — an uploaded photograph, a drawn avatar, or its initial —
 * from the columns that hold each, checked rather than trusted.
 *
 * @param row - The profile row as stored.
 * @returns What to draw.
 */
const readAvatarChoice = (row: ProfileRow): ViewerProfile['avatar'] => {
  if (row.photoPath !== null) {
    return { kind: 'photo', isVideo: MOVING_FORMATS.has(extname(row.photoPath)) };
  }

  if (row.avatarStyle !== null && row.avatarSeed !== null && isAvatarStyle(row.avatarStyle)) {
    return { kind: 'drawn', style: row.avatarStyle, seed: row.avatarSeed };
  }

  return { kind: 'initial' };
};

/**
 * Turns a profile row into what the contract carries, reading the avatar back out of the several
 * columns that between them hold whichever kind was chosen.
 *
 * @param row - The row as stored.
 * @returns The profile, as the API describes one.
 */
const toProfile = (row: ProfileRow): ViewerProfile => ({
  id: row.id,
  name: row.name,
  colour: readColour(row.colour),
  avatar: readAvatarChoice(row),
  askStillWatchingAfter: StillWatchingSchema.catch(STILL_WATCHING_DEFAULT).parse(
    row.askStillWatchingAfter,
  ),
  showsWhatIamWatching: row.showsWhatIamWatching,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Turns a profile row and the row of the account holding it into what the contract carries, drawn
 * with whichever of the two holds a face.
 *
 * @param profile - The profile as stored.
 * @param household - The account's own picture columns, or nothing where it has no household row.
 * @returns The profile, as the API describes one.
 */
const toAccountProfile = (profile: ProfileRow, household: StoredFace | null): ViewerProfile =>
  toProfile({ ...profile, ...pickTheAccountsFace(household, profile) });

/**
 * Turns a chosen avatar into the columns that hold it, so that choosing one kind clears whatever
 * the other kind had left behind.
 *
 * @param avatar - What the profile should be drawn with.
 * @returns The columns to write.
 */
const avatarColumns = (
  avatar: ViewerProfile['avatar'] | undefined,
): { avatarStyle: string | null; avatarSeed: string | null; photoPath: string | null } | null => {
  if (avatar === undefined) {
    return null;
  }

  if (avatar.kind === 'drawn') {
    return { avatarStyle: avatar.style, avatarSeed: avatar.seed, photoPath: null };
  }

  if (avatar.kind === 'initial') {
    return { avatarStyle: null, avatarSeed: null, photoPath: null };
  }

  return null;
};

const HOUSEHOLD_FACE = {
  userId: userProfile.userId,
  photoPath: userProfile.photoPath,
  avatarStyle: userProfile.avatarStyle,
  avatarSeed: userProfile.avatarSeed,
  updatedAt: userProfile.updatedAt,
};

const COLUMNS = {
  id: viewerProfile.id,
  name: viewerProfile.name,
  colour: viewerProfile.colour,
  avatarStyle: viewerProfile.avatarStyle,
  avatarSeed: viewerProfile.avatarSeed,
  photoPath: viewerProfile.photoPath,
  askStillWatchingAfter: viewerProfile.askStillWatchingAfter,
  showsWhatIamWatching: viewerProfile.showsWhatIamWatching,
  createdAt: viewerProfile.createdAt,
  updatedAt: viewerProfile.updatedAt,
};

/**
 * The household's profiles, stored in Postgres, with their uploaded photographs on disk beside it.
 * Photographs are files rather than columns because they are large and are served directly; the row
 * holds only which file belongs to whom.
 *
 * @param db - The database to read and write.
 * @param photoDirectory - Where uploaded photographs are kept.
 * @returns The profile service.
 */
const createDatabaseProfileService = (
  db: ValenceDatabase,
  photoDirectory: string,
): ProfileService => {
  const listFor = async (userId: string): Promise<ViewerProfile[]> => {
    const rows = await db
      .select({ profile: COLUMNS, household: HOUSEHOLD_FACE })
      .from(viewerProfile)
      .leftJoin(userProfile, eq(userProfile.userId, viewerProfile.userId))
      .where(eq(viewerProfile.userId, userId))
      .orderBy(asc(viewerProfile.createdAt));

    return rows.map((row) => toAccountProfile(row.profile, row.household));
  };

  /**
   * Finds the profile an account watches under, creating one named after the account where it has
   * none — every account has a profile, since watch progress and history hang off it rather than off
   * the account.
   *
   * @param userId - The account being asked about.
   * @param name - What to call the profile where one has to be made.
   * @returns The profile to use.
   */
  const ensure = async (userId: string, name: string): Promise<ViewerProfile> => {
    const existing = await listFor(userId);
    const first = existing[0];

    if (first !== undefined) {
      return first;
    }

    const created = {
      id: randomUUID(),
      userId,
      name: name.trim() === '' ? say('server.defaults.me') : name.trim(),
      colour: DEFAULT_COLOUR,
    };

    await db.insert(viewerProfile).values(created);

    return {
      id: created.id,
      name: created.name,
      colour: readColour(created.colour),
      avatar: { kind: 'initial' },
      askStillWatchingAfter: STILL_WATCHING_DEFAULT,
      showsWhatIamWatching: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  return {
    list: listFor,

    ensureDefault: ensure,

    create: async (userId, request) => {
      const existing = await listFor(userId);

      if (existing.length >= LIMIT) {
        throw new Error(`An account may hold ${LIMIT.toString()} profiles.`);
      }

      const created = {
        id: randomUUID(),
        userId,
        name: request.name,
        colour: request.colour,
      };

      await db.insert(viewerProfile).values(created);

      return {
        id: created.id,
        name: created.name,
        colour: created.colour,
        avatar: { kind: 'initial' },
        askStillWatchingAfter: STILL_WATCHING_DEFAULT,
        showsWhatIamWatching: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },

    rename: async (userId, profileId, request) => {
      const chosen = avatarColumns(request.avatar);

      const changed = await db
        .update(viewerProfile)
        .set({
          ...(request.askStillWatchingAfter === undefined
            ? {}
            : { askStillWatchingAfter: request.askStillWatchingAfter }),
          ...(request.showsWhatIamWatching === undefined
            ? {}
            : { showsWhatIamWatching: request.showsWhatIamWatching }),
          name: request.name,
          colour: request.colour,
          updatedAt: new Date(),
          ...chosen,
        })
        .where(and(eq(viewerProfile.id, profileId), eq(viewerProfile.userId, userId)))
        .returning({ id: viewerProfile.id });

      return changed.length > 0;
    },

    remove: async (userId, profileId) => {
      const existing = await listFor(userId);

      if (existing.length <= 1 || !existing.some((one) => one.id === profileId)) {
        return false;
      }

      await dropPrivatePlaylistsOf(db, [profileId]);

      const removed = await db
        .delete(viewerProfile)
        .where(and(eq(viewerProfile.id, profileId), eq(viewerProfile.userId, userId)))
        .returning({ id: viewerProfile.id });

      return removed.length > 0;
    },

    belongsTo: async (userId, profileId) => {
      const rows = await db
        .select({ id: viewerProfile.id })
        .from(viewerProfile)
        .where(and(eq(viewerProfile.id, profileId), eq(viewerProfile.userId, userId)))
        .limit(1);

      return rows.length > 0;
    },

    listEveryone: async () => {
      const rows = await db
        .select({
          userId: user.id,
          userName: user.name,
          createdAt: user.createdAt,
          profile: COLUMNS,
          household: HOUSEHOLD_FACE,
        })
        .from(user)
        .leftJoin(viewerProfile, eq(viewerProfile.userId, user.id))
        .leftJoin(userProfile, eq(userProfile.userId, user.id))
        .orderBy(asc(user.createdAt));

      const everyone: ViewerProfile[] = [];

      for (const row of pickOneFaceEach(rows)) {
        everyone.push(
          row.profile === null
            ? await ensure(row.userId, row.userName)
            : toAccountProfile(row.profile, row.household),
        );
      }

      return everyone.sort((one, other) => one.name.localeCompare(other.name));
    },

    accountOf: async (profileId) => {
      const rows = await db
        .select({ userId: viewerProfile.userId })
        .from(viewerProfile)
        .where(eq(viewerProfile.id, profileId))
        .limit(1);

      return rows[0]?.userId ?? null;
    },

    findSignInEmail: async (profileId) => {
      const rows = await db
        .select({ email: user.email })
        .from(viewerProfile)
        .innerJoin(user, eq(user.id, viewerProfile.userId))
        .where(eq(viewerProfile.id, profileId))
        .limit(1);

      return rows[0]?.email ?? null;
    },

    readAvatar: async (profileId) => {
      const rows = await db
        .select({ profile: COLUMNS, household: HOUSEHOLD_FACE })
        .from(viewerProfile)
        .leftJoin(userProfile, eq(userProfile.userId, viewerProfile.userId))
        .where(eq(viewerProfile.id, profileId))
        .limit(1);
      const found = rows[0];

      if (found === undefined) {
        return null;
      }

      const face = pickTheAccountsFace(found.household, found.profile);
      const choice = readAvatarChoice({ ...found.profile, ...face });

      if (choice.kind === 'drawn') {
        return {
          body: new TextEncoder().encode(drawAvatar(choice.style, choice.seed)),
          contentType: 'image/svg+xml',
        };
      }

      if (choice.kind === 'photo' && face.photoPath !== null) {
        const body = await readFile(join(photoDirectory, face.photoPath)).catch(() => null);

        if (body !== null) {
          return {
            body,
            contentType: PHOTO_CONTENT_TYPES[extname(face.photoPath)] ?? 'image/jpeg',
          };
        }
      }

      return null;
    },

    savePhoto: async (userId, profileId, photo) => {
      const owned = await db
        .select({ id: viewerProfile.id })
        .from(viewerProfile)
        .where(and(eq(viewerProfile.id, profileId), eq(viewerProfile.userId, userId)))
        .limit(1);

      if (owned.length === 0) {
        return 'notYours';
      }

      const wrong = await whatIsWrongWithThePicture(photo);

      if (wrong !== null) {
        return wrong;
      }

      const extension = extensionFor(photo.contentType) ?? '.png';

      await mkdir(photoDirectory, { recursive: true });

      const name = `${profileId}${extension}`;

      await writeFile(join(photoDirectory, name), photo.body);

      await db
        .update(viewerProfile)
        .set({ photoPath: name, avatarStyle: null, avatarSeed: null, updatedAt: new Date() })
        .where(eq(viewerProfile.id, profileId));

      return null;
    },

    moveTo: async (profileId, newOwnerId) => {
      const moved = await db
        .update(viewerProfile)
        .set({ userId: newOwnerId, updatedAt: new Date() })
        .where(eq(viewerProfile.id, profileId))
        .returning({ id: viewerProfile.id });

      return moved.length > 0;
    },
  };
};

export { createDatabaseProfileService };
