/**
 * Where to send somebody back to after connecting an account: a path on this server, and nowhere
 * else, whatever was asked for.
 *
 * @param asked - Where the client asked to come back to.
 * @returns A path on this server.
 */
const pathOnThisServer = (asked: string | undefined): string =>
  asked !== undefined && asked.startsWith('/') && !asked.startsWith('//') && !asked.includes('\\')
    ? asked
    : '/';

export { pathOnThisServer };
