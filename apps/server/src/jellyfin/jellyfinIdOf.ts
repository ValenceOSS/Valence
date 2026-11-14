/**
 * Writes one of Valence's identifiers the way Jellyfin writes its own: thirty-two hexadecimal
 * digits with no dashes, which turns back into the same identifier.
 *
 * @param id - A UUID.
 * @returns The identifier as Jellyfin writes one.
 */
const jellyfinIdOf = (id: string): string => id.replaceAll('-', '').toLowerCase();

export { jellyfinIdOf };
