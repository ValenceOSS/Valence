import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { whicheverAnswers } from '@ValencePhone/platform/whicheverAnswers';

const ANSWERS = ['phone', 'server-answers'] as const;

const WHILE_AWAY = 4000;

const WHILE_HERE = 30000;

/**
 * Whether this phone's Valence is answering, asked every few seconds while it is not and now and
 * then while it is.
 *
 * The moment it answers again after going quiet, everything is asked for afresh, so a server that
 * restarted puts the app back as it was without anybody pressing anything.
 *
 * @returns Where the server is, whether it has gone quiet, and a way to ask it now.
 */
const useTheServer = (): { address: string | null; isAway: boolean; tryNow: () => void } => {
  const cache = useQueryClient();
  const address = platformInUse().serverAddress();
  const answers = useQuery({
    queryKey: [...ANSWERS, address],
    queryFn: async () => address !== null && (await whicheverAnswers([address])) !== null,
    refetchInterval: (query) => (query.state.data === false ? WHILE_AWAY : WHILE_HERE),
    retry: false,
  });
  const wasAway = useRef(false);
  const isAway = answers.data === false;

  useEffect(() => {
    if (wasAway.current && !isAway && answers.data === true) {
      void cache.invalidateQueries({ predicate: (query) => query.queryKey[0] !== ANSWERS[0] });
    }

    wasAway.current = isAway;
  }, [isAway, answers.data, cache]);

  return {
    address,
    isAway,
    tryNow: () => {
      void answers.refetch();
    },
  };
};

export { useTheServer };
