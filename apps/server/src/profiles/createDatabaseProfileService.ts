import { countAffected } from '@ValenceDatabase/countAffected';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { and, asc, desc, eq } from 'drizzle-orm';
import { drawAvatar, isAvatarStyle } from './drawAvatar';
import { extensionFor, whatIsWrongWithThePicture } from './whatIsWrongWithThePicture';
import { pickOneFaceEach } from './pickOneFaceEach';
import { viewerProfile, user } from '#dialect/Schema';
import { dropPrivatePlaylistsOf } from '@ValenceServer/playlists/dropPrivatePlaylistsOf';
import {
  STILL_WATCHING_DEFAULT,
  StillWatchingSchema,
} from '@ValenceContracts/schemas/StillWatching';
import {
  AvatarSchema,
  ProfileColourSchema,
  PROFILE_COLOURS,
} from '@ValenceContracts/schemas/ViewerProfile';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ProfileService } from './ProfileService';
import type { ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import {
  DEFAULT_DISCORD_PRESENCE,
  DiscordPresenceSchema,
} from '@ValenceContracts/schemas/DiscordPresence';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import { say } from '@ValenceI18n/say';
import { MOST_PROFILES } from '@ValenceContracts/constants/MOST_PROFILES';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

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

type ProfileRow = {
  id: string;
  name: string;
  colour: string;
  avatarStyle: string | null;
  avatarSeed: string | null;
  photoPath: string | null;
  avatarLook: ViewerProfile['avatar'] | null;
  askStillWatchingAfter: number;
  showsWhatIamWatching: boolean;
  discordPresence: DiscordPresence | null;
  prefersBestCopy: boolean;
  isOwner: boolean;
  pinHash: string | null;
  mayRequest: boolean;
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
 * Reads what a profile is drawn with — an uploaded photograph and how it is framed, an orb or a
 * sketch with the picture kept of it, a drawn avatar, or its initial in its font — from the columns
 * that hold each, checked rather than trusted.
 *
 * @param row - The profile row as stored.
 * @returns What to draw.
 */
const readAvatarChoice = (row: ProfileRow): ViewerProfile['avatar'] => {
  const read = AvatarSchema.safeParse(row.avatarLook);
  const look = read.success ? read.data : null;

  if (look?.kind === 'orb' || look?.kind === 'sketch') {
    return look;
  }

  if (row.photoPath !== null) {
    return {
      kind: 'photo',
      isVideo: MOVING_FORMATS.has(extname(row.photoPath)),
      frame: look?.kind === 'photo' ? look.frame : null,
    };
  }

  if (row.avatarStyle !== null && row.avatarSeed !== null && isAvatarStyle(row.avatarStyle)) {
    return { kind: 'drawn', style: row.avatarStyle, seed: row.avatarSeed };
  }

  return {
    kind: 'initial',
    font: look?.kind === 'initial' ? look.font : PLUS_JAKARTA_SANS_AS_STORED,
  };
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
  discordPresence: DiscordPresenceSchema.catch(DEFAULT_DISCORD_PRESENCE).parse(
    row.discordPresence ?? {},
  ),
  prefersBestCopy: row.prefersBestCopy,
  isOwner: row.isOwner,
  hasPin: row.pinHash !== null,
  mayRequest: row.mayRequest,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Turns a chosen avatar into the columns that hold it, so that choosing one kind clears whatever
 * the other kind had left behind. A photograph, an orb and a sketch keep the picture the upload
 * before this wrote, and carry how they look alongside it.
 *
 * @param avatar - What the profile should be drawn with.
 * @returns The columns to write.
 */
const avatarColumns = (
  avatar: ViewerProfile['avatar'] | undefined,
): {
  avatarStyle?: string | null;
  avatarSeed?: string | null;
  photoPath?: string | null;
  avatarLook: ViewerProfile['avatar'] | null;
} | null => {
  if (avatar === undefined) {
    return null;
  }

  if (avatar.kind === 'drawn') {
    return {
      avatarStyle: avatar.style,
      avatarSeed: avatar.seed,
      photoPath: null,
      avatarLook: null,
    };
  }

  if (avatar.kind === 'initial') {
    return { avatarStyle: null, avatarSeed: null, photoPath: null, avatarLook: avatar };
  }

  if (avatar.kind === 'photo') {
    return { avatarLook: avatar };
  }

  return { avatarStyle: null, avatarSeed: null, avatarLook: avatar };
};

const COLUMNS = {
  id: viewerProfile.id,
  name: viewerProfile.name,
  colour: viewerProfile.colour,
  avatarStyle: viewerProfile.avatarStyle,
  avatarSeed: viewerProfile.avatarSeed,
  photoPath: viewerProfile.photoPath,
  avatarLook: viewerProfile.avatarLook,
  askStillWatchingAfter: viewerProfile.askStillWatchingAfter,
  showsWhatIamWatching: viewerProfile.showsWhatIamWatching,
  discordPresence: viewerProfile.discordPresence,
  prefersBestCopy: viewerProfile.prefersBestCopy,
  isOwner: viewerProfile.isOwner,
  pinHash: viewerProfile.pinHash,
  mayRequest: viewerProfile.mayRequest,
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
  db: AnyValenceDatabase,
  photoDirectory: string,
): ProfileService => {
  const listFor = async (userId: string): Promise<ViewerProfile[]> => {
    const rows = await db
      .select(COLUMNS)
      .from(viewerProfile)
      .where(eq(viewerProfile.userId, userId))
      .orderBy(desc(viewerProfile.isOwner), asc(viewerProfile.createdAt), asc(viewerProfile.id));

    return rows.map(toProfile);
  };

  /**
   * Finds the profile an account watches under, creating one named after the account where it has
   * none — every account has a profile, since watch progress and history hang off it rather than off
   * the account. Where two requests made one at once, the later gives way, so the account keeps one
   * owner.
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
      name: name.trim() === '' ? say('server.profiles.databaseProfileService.me') : name.trim(),
      colour: DEFAULT_COLOUR,
      isOwner: true,
    };

    await db.insert(viewerProfile).values(created);

    const [kept] = await listFor(userId);

    if (kept !== undefined && kept.id !== created.id) {
      await db.delete(viewerProfile).where(eq(viewerProfile.id, created.id));

      return kept;
    }

    return {
      id: created.id,
      name: created.name,
      colour: readColour(created.colour),
      avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
      askStillWatchingAfter: STILL_WATCHING_DEFAULT,
      showsWhatIamWatching: false,
      discordPresence: DEFAULT_DISCORD_PRESENCE,
      prefersBestCopy: false,
      isOwner: true,
      hasPin: false,
      mayRequest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  return {
    list: listFor,

    ensureDefault: ensure,

    create: async (userId, request) => {
      const existing = await listFor(userId);

      if (existing.length >= MOST_PROFILES) {
        throw new Error(`An account may hold ${MOST_PROFILES.toString()} profiles.`);
      }

      const created = {
        id: randomUUID(),
        userId,
        name: request.name,
        colour: request.colour,
        isOwner: existing.length === 0,
      };

      await db.insert(viewerProfile).values(created);

      return {
        id: created.id,
        name: created.name,
        colour: created.colour,
        avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
        askStillWatchingAfter: STILL_WATCHING_DEFAULT,
        showsWhatIamWatching: false,
        discordPresence: DEFAULT_DISCORD_PRESENCE,
        prefersBestCopy: false,
        isOwner: created.isOwner,
        hasPin: false,
        mayRequest: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },

    rename: async (userId, profileId, request) => {
      const chosen = avatarColumns(request.avatar);

      const changed = countAffected(
        await db
          .update(viewerProfile)
          .set({
            ...(request.askStillWatchingAfter === undefined
              ? {}
              : { askStillWatchingAfter: request.askStillWatchingAfter }),
            ...(request.showsWhatIamWatching === undefined
              ? {}
              : { showsWhatIamWatching: request.showsWhatIamWatching }),
            ...(request.discordPresence === undefined
              ? {}
              : { discordPresence: request.discordPresence }),
            ...(request.prefersBestCopy === undefined
              ? {}
              : { prefersBestCopy: request.prefersBestCopy }),
            name: request.name,
            colour: request.colour,
            updatedAt: new Date(),
            ...chosen,
          })
          .where(and(eq(viewerProfile.id, profileId), eq(viewerProfile.userId, userId))),
      );

      return changed > 0;
    },

    remove: async (userId, profileId) => {
      const existing = await listFor(userId);

      if (existing.length <= 1 || !existing.some((one) => one.id === profileId && !one.isOwner)) {
        return false;
      }

      await dropPrivatePlaylistsOf(db, [profileId]);

      const removed = countAffected(
        await db
          .delete(viewerProfile)
          .where(and(eq(viewerProfile.id, profileId), eq(viewerProfile.userId, userId))),
      );

      return removed > 0;
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
        })
        .from(user)
        .leftJoin(viewerProfile, eq(viewerProfile.userId, user.id))
        .orderBy(asc(user.createdAt));

      return pickOneFaceEach(rows)
        .flatMap((row) => (row.profile === null ? [] : [toProfile(row.profile)]))
        .sort((one, other) => one.name.localeCompare(other.name));
    },

    accountOf: async (profileId) => {
      const rows = await db
        .select({ userId: viewerProfile.userId })
        .from(viewerProfile)
        .where(eq(viewerProfile.id, profileId))
        .limit(1);

      return rows[0]?.userId ?? null;
    },

    standingOf: async (profileId) => {
      const [row] = await db
        .select({
          id: viewerProfile.id,
          userId: viewerProfile.userId,
          name: viewerProfile.name,
          isOwner: viewerProfile.isOwner,
          mayRequest: viewerProfile.mayRequest,
          pinHash: viewerProfile.pinHash,
          pinFailures: viewerProfile.pinFailures,
          pinLockedUntil: viewerProfile.pinLockedUntil,
        })
        .from(viewerProfile)
        .where(eq(viewerProfile.id, profileId))
        .limit(1);

      return row ?? null;
    },

    setPin: async (profileId, pinHash) => {
      await db
        .update(viewerProfile)
        .set({ pinHash, pinFailures: 0, pinLockedUntil: null, updatedAt: new Date() })
        .where(eq(viewerProfile.id, profileId));
    },

    setPinTries: async (profileId, failures, lockedUntil) => {
      await db
        .update(viewerProfile)
        .set({ pinFailures: failures, pinLockedUntil: lockedUntil })
        .where(eq(viewerProfile.id, profileId));
    },

    claimAPinTry: (profileId, at, lockFor) =>
      db.transaction(async (tx) => {
        const [row] = await tx
          .select({
            failures: viewerProfile.pinFailures,
            lockedUntil: viewerProfile.pinLockedUntil,
          })
          .from(viewerProfile)
          .where(eq(viewerProfile.id, profileId))
          .for('update');

        if (row === undefined) {
          return null;
        }

        if (row.lockedUntil !== null && row.lockedUntil.getTime() > at.getTime()) {
          return { kind: 'locked', until: row.lockedUntil } as const;
        }

        const failures = row.failures + 1;
        const lockedUntil = lockFor(failures);

        await tx
          .update(viewerProfile)
          .set({ pinFailures: failures, pinLockedUntil: lockedUntil })
          .where(eq(viewerProfile.id, profileId));

        return { kind: 'counted', failures, lockedUntil } as const;
      }),

    setMayRequest: async (profileId, mayRequest) => {
      await db
        .update(viewerProfile)
        .set({ mayRequest, updatedAt: new Date() })
        .where(eq(viewerProfile.id, profileId));
    },

    handOver: async (userId, profileId) => {
      const existing = await listFor(userId);

      if (!existing.some((one) => one.id === profileId)) {
        return false;
      }

      await db.transaction(async (tx) => {
        await tx
          .update(viewerProfile)
          .set({ isOwner: false, updatedAt: new Date() })
          .where(eq(viewerProfile.userId, userId));
        await tx
          .update(viewerProfile)
          .set({ isOwner: true, updatedAt: new Date() })
          .where(and(eq(viewerProfile.id, profileId), eq(viewerProfile.userId, userId)));
      });

      return true;
    },

    findSignIn: async (profileId) => {
      const rows = await db
        .select({ email: user.email, username: user.username })
        .from(viewerProfile)
        .innerJoin(user, eq(user.id, viewerProfile.userId))
        .where(eq(viewerProfile.id, profileId))
        .limit(1);

      return rows[0] ?? null;
    },

    readAvatar: async (profileId) => {
      const rows = await db
        .select(COLUMNS)
        .from(viewerProfile)
        .where(eq(viewerProfile.id, profileId))
        .limit(1);
      const face = rows[0];

      if (face === undefined) {
        return null;
      }

      const choice = readAvatarChoice(face);

      if (choice.kind === 'drawn') {
        return {
          body: new TextEncoder().encode(drawAvatar(choice.style, choice.seed)),
          contentType: 'image/svg+xml',
        };
      }

      if (choice.kind !== 'initial' && face.photoPath !== null) {
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
      const moved = countAffected(
        await db
          .update(viewerProfile)
          .set({ userId: newOwnerId, isOwner: true, updatedAt: new Date() })
          .where(eq(viewerProfile.id, profileId)),
      );

      return moved > 0;
    },
  };
};

export { createDatabaseProfileService };
