import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';

/**
 * Which face is watching on this device, as an id, for keying the things that belong to a person
 * rather than to an account.
 *
 * An account is the wrong key for any of them. A household shares one login and the whole point of
 * profiles is that what one person keeps, rates or is part-way through is not what another does — so
 * anything cached against the account shows the last person's answer to the next one until the page
 * is reloaded.
 *
 * Answers with nothing until the profiles have been read, which is the honest answer rather than a
 * guess: a query keyed on a person cannot run before it is known which person, and the queries that
 * take this hold off until it arrives.
 *
 * @returns The profile watching here, or nothing while that is still being worked out.
 */
const useWatchingProfile = (): string | null => {
  const asked = useQuery(profileQueries.watching());

  return asked.data?.id ?? null;
};

export { useWatchingProfile };
