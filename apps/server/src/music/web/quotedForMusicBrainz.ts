/**
 * Quotes a name for a MusicBrainz search, so a title with quotation marks or a backslash in it is
 * searched for as it is rather than read as part of the query.
 *
 * @param name - The name.
 * @returns It quoted.
 */
const quotedForMusicBrainz = (name: string): string => `"${name.replace(/["\\]/g, '\\$&')}"`;

export { quotedForMusicBrainz };
