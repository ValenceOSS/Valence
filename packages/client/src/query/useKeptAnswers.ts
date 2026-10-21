import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { keepAnswers } from '@ValenceClient/query/keepAnswers';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';

/**
 * Keeps the slow admin answers on this device for whoever is signed in, for as long as the caller is
 * shown, where the client has somewhere to keep them.
 */
const useKeptAnswers = (): void => {
  const answers = useQueryClient();
  const accountId = useQuery(sessionQueries.who()).data?.id ?? null;

  useEffect(() => {
    const { kept } = platformInUse();

    if (accountId === null || kept === undefined) {
      return;
    }

    return keepAnswers(answers, accountId, kept);
  }, [answers, accountId]);
};

export { useKeptAnswers };
