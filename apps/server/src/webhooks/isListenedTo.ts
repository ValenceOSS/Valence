import type { MediaKind } from '@ValenceContracts/schemas/MediaKind';

/**
 * Says whether a kind of thing is listened to rather than watched, which is how a webhook words it.
 *
 * @param kind - What was played.
 * @returns Whether it is a song or an audiobook.
 */
const isListenedTo = (kind: MediaKind): boolean => kind === 'song' || kind === 'book';

export { isListenedTo };
