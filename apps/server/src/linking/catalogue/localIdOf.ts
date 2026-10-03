import { createHash } from 'node:crypto';

/**
 * The id this server gives something a linked server shares: the same every time for the same
 * thing from the same server, so keeping a catalogue up to date changes the rows already kept
 * rather than adding them again, and shaped as a UUID, as every id this server reads is.
 *
 * @param serverId - The linked server.
 * @param remoteId - What that server calls it.
 * @returns The id here.
 */
const localIdOf = (serverId: string, remoteId: string): string => {
  const hex = createHash('sha256').update(`${serverId}\n${remoteId}`).digest('hex');
  const variant = ((Number.parseInt(hex.slice(16, 17), 16) % 4) + 8).toString(16);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export { localIdOf };
