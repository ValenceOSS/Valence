/**
 * What identifies a programme for Jellyfin: the library it is in and Valence's own identifier for
 * it, since a programme is found in Valence through both.
 *
 * @param libraryId - The library.
 * @param showId - The programme, as Valence identifies it.
 * @returns The key.
 */
const showKeyOf = (libraryId: string, showId: string): string => `${libraryId}:${showId}`;

export { showKeyOf };
