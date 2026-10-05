/**
 * Where the cover of a song the library does not have is read from: this server, which finds it
 * once and keeps it — the release's own small cover from the Cover Art Archive where the song names
 * its release, or a record of that name by that artist in Apple's catalogue otherwise.
 *
 * @param missing - The release, where known, and what the record is called and who it is by.
 * @returns The picture's address.
 */
const missingCoverUrl = (missing: {
  releaseId: string | null;
  title: string;
  artist: string;
}): string => {
  const named = new URLSearchParams({ title: missing.title, artist: missing.artist }).toString();

  return missing.releaseId === null
    ? `/api/music/catalogue/named-covers?${named}`
    : `/api/music/catalogue/release-covers/${encodeURIComponent(missing.releaseId)}?${named}`;
};

export { missingCoverUrl };
