const JELLYFIN_ID = /^[0-9a-f]{32}$/u;

/**
 * Reads the UUID a Jellyfin identifier stands for, from its thirty-two digits or from a UUID a
 * client sends back as it was.
 *
 * @param id - The identifier a client sent.
 * @returns The UUID, or nothing where the identifier is not one.
 */
const uuidOfJellyfinId = (id: string): string | null => {
  const bare = id.replaceAll('-', '').toLowerCase();

  if (!JELLYFIN_ID.test(bare)) {
    return null;
  }

  return [
    bare.slice(0, 8),
    bare.slice(8, 12),
    bare.slice(12, 16),
    bare.slice(16, 20),
    bare.slice(20),
  ].join('-');
};

export { uuidOfJellyfinId };
