/**
 * The name this server keeps its copy of a linked server's picture under, apart from its own.
 *
 * @param serverId - The linked server.
 * @returns The key.
 */
const linkedPictureKey = (serverId: string): string => `linked-${serverId}`;

export { linkedPictureKey };
