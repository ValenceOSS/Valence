import { createHmac } from 'node:crypto';

/**
 * What one of this server's people is called to one linked server: the same every time for that
 * server, different for every other, and impossible to work back from without this server's secret.
 *
 * @param secret - This server's pseudonym secret.
 * @param linkedServerId - The server they are being named to.
 * @param profileId - Who they are here.
 * @returns The pseudonym.
 */
const pseudonymOf = (secret: string, linkedServerId: string, profileId: string): string =>
  createHmac('sha256', secret).update(`${linkedServerId}\n${profileId}`).digest('base64url');

export { pseudonymOf };
