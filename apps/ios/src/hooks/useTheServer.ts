import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { sendWatchedOffline } from '@ValenceClient/offline/watchedOffline';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { whicheverAnswers } from '@ValencePhone/platform/whicheverAnswers';

const ANSWERS = ['phone', 'server-answers'] as const;

const WHILE_AWAY = 4000;

const WHILE_HERE = 30000;

/**
 * Whether this phone's Valence is answering, asked every few seconds while it is not and now and
 * then while it is.
 *
 * Whichever one is asked to pick up, the moment the server answers again after going quiet, tells it
 * how far somebody got in anything they watched from the phone meanwhile and has everything asked
 * for afresh, so a server that restarted puts the app back as it was without anybody pressing
 * anything. Where somebody is signed in and the socket is already back, the socket has asked for
 * everything afresh itself, so it is not asked for twice.
 *
 * @param pickingUp - Whether this one picks up after the server, and how, or leaves it to another.
 * @returns Where the server is, whether it has gone quiet, and a way to ask it now.
 */
const useTheServer = (
  pickingUp: 'elsewhere' | 'here' | 'beside the socket' = 'elsewhere',
): { address: string | null; isAway: boolean; tryNow: () => void } => {
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
    if (pickingUp !== 'elsewhere' && wasAway.current && !isAway && answers.data === true) {
      void sendWatchedOffline();

      if (pickingUp === 'here' || !getRealtimeClient().isLive()) {
        void cache.invalidateQueries(
          { predicate: (query) => query.queryKey[0] !== ANSWERS[0] },
          { cancelRefetch: false },
        );
      }
    }

    wasAway.current = isAway;
  }, [pickingUp, isAway, answers.data, cache]);

  return {
    address,
    isAway,
    tryNow: () => {
      void answers.refetch();
    },
  };
};

export { useTheServer };
