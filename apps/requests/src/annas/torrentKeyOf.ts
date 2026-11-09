/**
 * The key a torrent is found by: its group and its name, since two groups can name a torrent alike.
 *
 * @param group - Its group.
 * @param name - Its name.
 * @returns The key.
 */
const torrentKeyOf = (group: string, name: string): string => `${group}\u0000${name}`;

export { torrentKeyOf };
