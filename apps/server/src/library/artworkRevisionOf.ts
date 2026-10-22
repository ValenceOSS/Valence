/**
 * Says when an item's pictures last changed, as the number a client puts in their addresses so it
 * asks for the new ones rather than showing what it kept; nothing where they never changed.
 *
 * @param changedAt - When they last changed, or null.
 * @returns The revision to send, or nothing.
 */
const artworkRevisionOf = (changedAt: Date | null): { artworkRevision?: number } =>
  changedAt === null ? {} : { artworkRevision: changedAt.getTime() };

export { artworkRevisionOf };
