import { useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { applyRoundness } from '@ValenceScreens/roundness/applyRoundness';

/**
 * Keeps the document marked with how round the server says everything should be.
 *
 * Asked for before anybody has signed in, because the way in is drawn with the same corners as
 * everything after it. Until the server has answered, or where it cannot, everything is drawn as it
 * always was, and nothing is asked at all while there is no server to ask.
 */
const useAppliedRoundness = (): void => {
  const { isOffline } = useOfflineMode();
  const asked = useQuery({ ...appearanceQueries.appearance(), enabled: !isOffline });
  const roundness = asked.data?.roundness ?? 'default';

  useLayoutEffect(() => {
    applyRoundness(roundness);
  }, [roundness]);
};

export { useAppliedRoundness };
