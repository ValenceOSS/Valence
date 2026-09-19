import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';

const PRIMARY_TYPES: ReadonlyMap<string, ReleaseType> = new Map([
  ['Album', 'album'],
  ['EP', 'ep'],
  ['Single', 'single'],
]);

/**
 * What kind of release a MusicBrainz release group is, as an artist can be watched for: a live
 * record or a compilation by what it is besides, and otherwise an album, an EP or a single. A
 * soundtrack, a remix, an interview and the like are none of them, and are never fetched for an
 * artist.
 *
 * @param primary - Its primary type, such as `Album`.
 * @param secondary - Its secondary types, such as `Live`.
 * @returns The kind, or null where it is none an artist is watched for.
 */
const releaseTypeOf = (
  primary: string | null,
  secondary: readonly string[],
): ReleaseType | null => {
  if (secondary.includes('Live')) {
    return 'live';
  }

  if (secondary.includes('Compilation')) {
    return 'compilation';
  }

  if (secondary.length > 0) {
    return null;
  }

  return primary === null ? null : (PRIMARY_TYPES.get(primary) ?? null);
};

export { releaseTypeOf };
