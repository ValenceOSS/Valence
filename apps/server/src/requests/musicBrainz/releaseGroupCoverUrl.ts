/**
 * Where the Cover Art Archive keeps a small front cover for a release group, which a browser can
 * be pointed at without asking whether one is there — a missing one shows as no picture.
 *
 * @param releaseGroupId - The release group's MusicBrainz id.
 * @returns The picture's address.
 */
const releaseGroupCoverUrl = (releaseGroupId: string): string =>
  `https://coverartarchive.org/release-group/${encodeURIComponent(releaseGroupId)}/front-250`;

export { releaseGroupCoverUrl };
