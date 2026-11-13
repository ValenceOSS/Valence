import { createHmac } from 'node:crypto';

const NAME_LENGTH = 32;

/**
 * The name a picture is kept and served under where anybody may fetch it: keyed by the server's own
 * secret, so it cannot be worked out from the picture's address, and nobody holding a catalogue's
 * address for a film can ask whether this server has it.
 *
 * @param secret - The server's secret for naming artwork.
 * @param url - Where the picture comes from.
 * @returns Thirty-two hexadecimal characters.
 */
const artworkNameOf = (secret: string, url: string): string =>
  createHmac('sha256', secret).update(url).digest('hex').slice(0, NAME_LENGTH);

export { artworkNameOf };
