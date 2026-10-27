import { createHash } from 'node:crypto';

type Chosen = { path: string; pluginId: string; sourceId: string; streamKey: string };

/**
 * What the media service knows a streamed film's file by: the film and the stream chosen for it,
 * so a different stream of the same film is a different input whose keyframes are read afresh,
 * while a fresh link to the same stream is the same one.
 *
 * @param chosen - The film's path and the stream chosen for it.
 * @returns The key, in the letters, digits and dashes the media service accepts.
 */
const remoteKeyOf = ({ path, pluginId, sourceId, streamKey }: Chosen): string =>
  `streamed-${createHash('sha256')
    .update([path, pluginId, sourceId, streamKey].join('\u0000'))
    .digest('hex')
    .slice(0, 32)}`;

export { remoteKeyOf };
