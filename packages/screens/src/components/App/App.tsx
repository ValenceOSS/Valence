import { useCallback, useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SplashScreenWithBrand } from '@ValenceScreens/components/SplashScreenWithBrand/SplashScreenWithBrand';
import { SetupWizard } from '@ValenceScreens/components/SetupWizard/SetupWizard';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { say } from '@ValenceI18n/say';

/**
 * The application itself, at every address: whether this server has been set up, and the page the
 * address in the bar asks for.
 *
 * Setup is decided from what the server reports rather than from anything held here, so a second
 * browser cannot skip it and a stale tab cannot behave as though it is past it. Once begun it stays
 * on screen until it is finished, though the server reports itself set up as soon as the
 * administrator is made, partway through.
 */
const App = () => {
  const cache = useQueryClient();

  const server = useQuery(sessionQueries.setup());
  const status = server.data ?? null;
  const [setup, setSetup] = useState<'waiting' | 'running' | 'finished'>('waiting');

  if (status !== null && !status.isComplete && setup === 'waiting') {
    setSetup('running');
  }

  const refresh = useCallback(
    async () => cache.invalidateQueries({ queryKey: sessionQueries.key }),
    [cache],
  );

  if (server.isPending || server.isError || status === null) {
    const hasFailed = server.isError || server.failureCount > 0;

    return (
      <SplashScreenWithBrand
        failure={
          hasFailed
            ? {
                title: say('common.valenceIsNotReachable'),
                detail: say('common.theServerDidNotRespondCheck'),
              }
            : null
        }
        isTryingAgain={hasFailed && server.isFetching && server.isError}
        onTryAgain={() => {
          void server.refetch();
        }}
        hasMark={true}
        marksPlace="valence-mark"
      />
    );
  }

  if (setup === 'running') {
    return (
      <SetupWizard
        status={status}
        onComplete={() => {
          setSetup('finished');
          void refresh();
        }}
      />
    );
  }

  return <Outlet />;
};

App.displayName = 'App';

export { App };
