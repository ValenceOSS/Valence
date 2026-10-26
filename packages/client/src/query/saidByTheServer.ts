import { RequestFailed } from './RequestFailed';

/**
 * What the server said when it refused a read, for a screen to show in place of its own words
 * about failing — that a site is rate limiting rather than that the search failed.
 *
 * @param error - Why the read failed, or nothing where it did not.
 * @returns The server's words, or null where it gave none.
 */
const saidByTheServer = (error: Error | null): string | null =>
  error instanceof RequestFailed ? error.said : null;

export { saidByTheServer };
