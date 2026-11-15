import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import type { Askable } from './whoCanBeAsked';

/**
 * Everybody who could be asked along to a watch party: the household here, and then the people
 * from linked servers who have watched here, named with their server. Read only while there is a
 * party to ask them to.
 *
 * @param isInAParty - Whether this client is in a party now.
 * @returns The people, by an id to ask them by, their name and, for the household, their face.
 */
const useAskableAlong = (isInAParty: boolean) => {
  const here = useQuery({ ...sessionQueries.everyone(), enabled: isInAParty });
  const elsewhere = useQuery({ ...linkingQueries.askableElsewhere(), enabled: isInAParty });

  return useMemo(
    (): readonly Askable[] => [...(here.data ?? []), ...(elsewhere.data ?? [])],
    [here.data, elsewhere.data],
  );
};

export { useAskableAlong };
