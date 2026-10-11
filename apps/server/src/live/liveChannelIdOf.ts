import { createHash } from 'node:crypto';

/**
 * A channel's id, made from its source and what it streams from, so the same channel keeps the
 * same id each time its source is read again, and whoever kept it as a favourite keeps it.
 *
 * @param sourceId - The source it comes from.
 * @param streamUrl - Where it streams from.
 * @returns The id, shaped as a UUID.
 */
const liveChannelIdOf = (sourceId: string, streamUrl: string): string => {
  const hex = createHash('sha256').update(`${sourceId}\n${streamUrl}`).digest('hex');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export { liveChannelIdOf };
