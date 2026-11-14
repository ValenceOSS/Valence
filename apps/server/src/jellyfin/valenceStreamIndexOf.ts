/**
 * Valence's index for the audio or subtitle stream a Jellyfin app chose by the index it was given.
 *
 * @param jellyfinIndex - The index the app sent, where it sent one.
 * @returns Valence's index, or nothing where the app chose none or chose the picture.
 */
const valenceStreamIndexOf = (jellyfinIndex: number | undefined): number | undefined =>
  jellyfinIndex === undefined || jellyfinIndex < 1 ? undefined : jellyfinIndex - 1;

export { valenceStreamIndexOf };
