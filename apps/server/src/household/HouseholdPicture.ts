import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

const HOUSEHOLD_LIMITS: PictureLimits = {
  mostBytes: 6 * 1024 * 1024,
  mostPixelsAnEdge: 4096,
};

/**
 * The filename a household's picture is kept under.
 *
 * Prefixed, because household pictures share a directory with the faces of the people in them and a
 * household's identifier is an account's while a face's is a profile's. Two different things naming
 * a file after two different identifiers in one folder is a collision waiting for the day the two
 * happen to match.
 *
 * @param userId - The account the picture belongs to.
 * @param extension - The file extension, including its dot.
 * @returns What to call the file.
 */
const householdPhotoName = (userId: string, extension: string): string =>
  `household-${userId}${extension}`;

export { HOUSEHOLD_LIMITS, householdPhotoName };
