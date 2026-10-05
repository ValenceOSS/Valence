/**
 * What a release's title is once what one edition of it adds is taken off — "Isles (Deluxe)" and
 * "Isles - Remastered" are both "Isles" — so the album a streaming service names can be found among
 * MusicBrainz's, which names the album once for every edition.
 *
 * @param title - The title.
 * @returns It without the edition, or as it was where it is nothing but one.
 */
const baseTitleOf = (title: string): string =>
  title
    .replace(/\s*(?:\([^)]*\)|\[[^\]]*\])\s*$/u, '')
    .replace(/\s+[-–—]\s+.*$/u, '')
    .trim() || title.trim();

export { baseTitleOf };
