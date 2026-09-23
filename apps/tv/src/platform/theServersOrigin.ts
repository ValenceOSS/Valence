import { serverAddress } from '@ValenceClient/session/serverAddress';

/**
 * Which Valence this television watches, or nothing before it has been told.
 *
 * A browser never asks, because its pages came from the server. A television has no origin of its
 * own, so the address is something it is told once and keeps; until then there is nowhere to send a
 * request, and the screen that asks is the only thing drawn.
 *
 * @returns The origin every request, stream and socket is put on, or nothing.
 */
const theServersOrigin = (): string | null => serverAddress();

/**
 * Puts a path the server answered with — a poster, a stream — back on the server it came from.
 *
 * @param path - What the server said, usually a path.
 * @returns An address the player and the image loader can open.
 */
const onTheServer = (path: string): string => {
  const origin = theServersOrigin();

  return origin === null || !path.startsWith('/') ? path : `${origin}${path}`;
};

export { onTheServer, theServersOrigin };
