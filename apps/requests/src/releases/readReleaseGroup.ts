const NOT_GROUPS =
  /^(dl|rip|hd|ma|x|web|sub|subs|dub|raw|mkv|mp4|avi|weekly|eng|multi|imax|hevc|aac|flac|vostfr|tgx|\d+p?|x26[45]|10bits?)$/i;

/**
 * Who put a release out: the fansub group in brackets a name starts with, the scene group after its
 * last dash, or a single word in brackets at its end — never a word of the name that only looks
 * like one, such as the `DL` of `WEB-DL`, a tag such as `[Weekly]`, or a checksum.
 *
 * @param name - The release name, as it was given.
 * @returns The group, or null where it names none.
 */
const readReleaseGroup = (name: string): string | null => {
  const bracketed = /^\[([^\]]+)\]/.exec(name.trim())?.[1];

  if (bracketed !== undefined) {
    return bracketed.trim();
  }

  const scene = /-([A-Za-z0-9][\w]*?)(?:\[[^\]]*\])?(?:\.(?:mkv|mp4|avi))?\s*$/.exec(
    name.trim(),
  )?.[1];

  if (scene !== undefined && !NOT_GROUPS.test(scene)) {
    return scene;
  }

  const trailing = /\[([A-Za-z0-9][\w]{1,30})\]\s*(?:\.(?:mkv|mp4|avi))?$/.exec(name.trim())?.[1];

  return trailing === undefined || NOT_GROUPS.test(trailing) || /^[\dA-F]{8}$/.test(trailing)
    ? null
    : trailing;
};

export { readReleaseGroup };
