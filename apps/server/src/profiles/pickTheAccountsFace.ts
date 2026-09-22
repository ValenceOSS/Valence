import { isAvatarStyle } from './drawAvatar';

type StoredFace = {
  photoPath: string | null;
  avatarStyle: string | null;
  avatarSeed: string | null;
  updatedAt: Date;
};

/**
 * Whether a row holds a face at all, rather than leaving whatever it belongs to as an initial.
 *
 * @param face - The picture columns as stored.
 * @returns Whether there is something to draw.
 */
const holdsAFace = (face: StoredFace): boolean =>
  face.photoPath !== null ||
  (face.avatarStyle !== null && face.avatarSeed !== null && isAvatarStyle(face.avatarStyle));

/**
 * Picks the face an account is drawn with — the account's own where it has one, and the profile's
 * where it has not — carrying the time that face was last changed so the address it is served from
 * changes with it.
 *
 * An account's picture lives on the household row: it is what setting up a household writes and
 * what an administrator setting somebody's picture writes. A profile's own picture is the older
 * place, still written when somebody changes their picture from their account, and still the only
 * one anybody who set theirs before has. Both are read, and the account's is preferred, because a
 * picture put on the account is the more deliberate act of the two.
 *
 * @param household - The account's picture columns, or nothing where it has no household row.
 * @param profile - The profile's own picture columns.
 * @returns The columns to draw from, and when they last changed.
 */
const pickTheAccountsFace = (household: StoredFace | null, profile: StoredFace): StoredFace => {
  const chosen = household !== null && holdsAFace(household) ? household : profile;

  return {
    photoPath: chosen.photoPath,
    avatarStyle: chosen.avatarStyle,
    avatarSeed: chosen.avatarSeed,
    updatedAt: chosen.updatedAt,
  };
};

export type { StoredFace };

export { pickTheAccountsFace };
