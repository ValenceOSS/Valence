import type { QueryClient } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';

/**
 * Empties the cache as somebody signs out, since everything held there belongs to the person
 * leaving — what they kept, how far through things they are, what is waiting on their bell — and
 * handing that to whoever signs in next is a privacy fault, not a stale read. The session's own
 * answers are reset rather than thrown away, so the screens already asking them hear that nobody is
 * signed in now and go to the way in; a query thrown away while a screen still holds it leaves that
 * screen on the old answer.
 *
 * @param cache - The query cache.
 * @returns Once the session has been read again.
 */
const forgetWhatWasRead = async (cache: QueryClient): Promise<void> => {
  await cache.resetQueries({ queryKey: sessionQueries.key });
  cache.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionQueries.key[0] });
};

export { forgetWhatWasRead };
