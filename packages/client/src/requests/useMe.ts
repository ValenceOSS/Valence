import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import type { Me } from '@ValenceContracts/functions/isMyAsk';

/**
 * Who is looking, as their account and the profile watching on this device, for telling their own
 * asks from everybody else's.
 *
 * @returns Who is looking, or nobody until both are known.
 */
const useMe = (): Me | null => {
  const who = useQuery(sessionQueries.who());
  const watching = useQuery(profileQueries.watching());
  const accountId = who.data?.id ?? null;
  const profileId = watching.data?.id ?? null;
  const isKnown = watching.isSuccess;

  return useMemo(
    () => (accountId === null || !isKnown ? null : { accountId, profileId }),
    [accountId, profileId, isKnown],
  );
};

export { useMe };
