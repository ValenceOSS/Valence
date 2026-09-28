/**
 * Where a record's cover is read from: this server, which finds it once — on the Cover Art Archive,
 * or in Apple's catalogue where the archive has none — and keeps it.
 *
 * @param releaseGroupId - The record's MusicBrainz release group.
 * @param hint - What it is called and who it is by, which Apple's catalogue is searched with.
 * @returns The picture's address.
 */
const releaseGroupCoverUrl = (
  releaseGroupId: string,
  hint: { title: string; artist: string | null } | null = null,
): string => {
  const asked =
    hint === null || hint.artist === null
      ? ''
      : `?${new URLSearchParams({ title: hint.title, artist: hint.artist }).toString()}`;

  return `/api/music/catalogue/covers/${encodeURIComponent(releaseGroupId)}${asked}`;
};

export { releaseGroupCoverUrl };
