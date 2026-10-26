import { saidByTheServer } from '@ValenceClient/query/saidByTheServer';
import { say } from '@ValenceI18n/say';

/**
 * Says why a search failed, in the server's words where it gave any — that a site is rate limiting
 * or unreachable — and plainly that it failed where it did not.
 *
 * @param error - Why the search failed.
 * @returns What to show in place of results.
 */
const whySearchFailed = (error: Error | null): string =>
  saidByTheServer(error) ?? say('client.query.whySearchFailed.theSearchCouldNotBeDone');

export { whySearchFailed };
