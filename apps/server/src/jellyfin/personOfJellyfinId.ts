import { PERSON_MARK } from '@ValenceServer/jellyfin/personJellyfinId';

/**
 * Reads the catalogue's number for a person back out of the Jellyfin identifier made for them.
 *
 * @param id - The identifier a client sent.
 * @returns The person's number, or nothing where the identifier is not a person's.
 */
const personOfJellyfinId = (id: string): number | null => {
  const bare = id.replaceAll('-', '').toLowerCase();

  if (!bare.startsWith(PERSON_MARK) || bare.length !== 32) {
    return null;
  }

  const read = Number.parseInt(bare.slice(PERSON_MARK.length), 16);

  return Number.isSafeInteger(read) && read > 0 ? read : null;
};

export { personOfJellyfinId };
