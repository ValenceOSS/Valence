/**
 * The index a Jellyfin app is given for one of Valence's audio or subtitle streams: one past
 * Valence's, so the picture can always be stream nought and nothing shares an index.
 *
 * @param valenceIndex - Valence's index for the stream.
 * @returns Jellyfin's.
 */
const jellyfinStreamIndexOf = (valenceIndex: number): number => valenceIndex + 1;

export { jellyfinStreamIndexOf };
