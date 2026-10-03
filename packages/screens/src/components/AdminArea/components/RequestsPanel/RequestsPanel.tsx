import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { notify } from '@ValenceUI/notify';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { RefreshCw as RefreshCwFilledIcon } from '@keyline-icons/react/fill';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { checkRequestsNow } from '@ValenceClient/requests/fetchRequests';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { describeRequestsSolver } from './describeRequestsSolver';
import { describeRequestsVpn } from './describeRequestsVpn';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const SOLVER_DOES = say('screens.adminArea.requestsPanel.opensSitesProtectedByCloudflareIn');

/**
 * The requests service as whoever set it up sees it: whether the server can reach it, which release
 * it is, whether the VPN it downloads through is up, whether the browser that gets past Cloudflare's
 * check is healthy, and how the indexers are, with a way to ask again now rather than waiting for
 * the next check.
 */
const RequestsPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(requestsQueries.overview());
  const [isChecking, setIsChecking] = useState(false);

  const checkNow = () => {
    setIsChecking(true);

    void checkRequestsNow()
      .then((fresh) => {
        cache.setQueryData(requestsQueries.overview().queryKey, fresh);
        notify.worked(say('screens.adminArea.requestsPanel.checkedTheRequests'));
      })
      .catch(() => {
        notify.failed(say('screens.adminArea.requestsPanel.theRequestsCouldNotBeChecked'));

        return asked.refetch();
      })
      .finally(() => {
        setIsChecking(false);
      });
  };

  const overview = asked.data ?? null;
  const vpn = overview === null ? null : describeRequestsVpn(overview);
  const solver = overview === null ? null : describeRequestsSolver(overview);
  const checkedWhen = overview === null ? null : saidWhen(overview.checkedAt ?? '');

  return (
    <PanelCard
      title={say('common.requests')}
      isFlush
      actions={
        <PanelCardAction icon={RefreshCwFilledIcon} isLoading={isChecking} onClick={checkNow}>
          {say('screens.adminArea.requestsPanel.checkNow')}
        </PanelCardAction>
      }
    >
      {asked.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.requestsPanel.theRequestsServiceCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : overview === null || vpn === null || solver === null ? (
        <Spinner
          isCentered
          label={say('screens.adminArea.requestsPanel.readingTheRequestsService')}
          size="sm"
        />
      ) : (
        <>
          <SettingList isInset>
            <SettingRow
              title={say('screens.adminArea.requestsPanel.requestsService')}
              description={
                checkedWhen === null
                  ? say('screens.adminArea.requestsPanel.notCheckedYetLookingForIt', {
                      address: overview.address,
                    })
                  : overview.problem === null
                    ? say('screens.adminArea.requestsPanel.atAddressLastCheckedWhen', {
                        address: overview.address,
                        when: checkedWhen,
                      })
                    : say('screens.adminArea.requestsPanel.atAddressLastCheckedWhenProblem', {
                        address: overview.address,
                        when: checkedWhen,
                        problem: sayAgain(overview.problem),
                      })
              }
            >
              {overview.checkedAt === null || overview.isReachable ? null : (
                <HowToFix href={docsFor(overview.problemCode ?? 'RequestsUnreachable')} />
              )}

              {overview.checkedAt === null ? (
                <Badge size="sm">{say('common.notChecked')}</Badge>
              ) : overview.isReachable ? (
                <Badge size="sm" tone="success">
                  {say('common.online')}
                </Badge>
              ) : (
                <Badge size="sm" tone="danger">
                  {say('screens.adminArea.requestsPanel.unreachable')}
                </Badge>
              )}
            </SettingRow>

            {overview.status === null ? null : (
              <SettingRow
                title={say('common.release')}
                description={say(
                  'screens.adminArea.requestsPanel.whichVersionOfTheRequestsService',
                )}
              >
                <Badge size="sm">{overview.status.version}</Badge>
              </SettingRow>
            )}

            <SettingRow title={say('screens.adminArea.requestsPanel.vPN')} description={vpn.detail}>
              <HowToFix href={vpn.help} />

              <Badge size="sm" tone={vpn.tone}>
                {vpn.label}
              </Badge>
            </SettingRow>

            <SettingRow
              title={say('screens.adminArea.requestsPanel.cloudflareSolver')}
              description={[SOLVER_DOES, solver.detail].filter((part) => part !== '').join(' ')}
            >
              <HowToFix href={solver.help} />

              <Badge size="sm" tone={solver.tone}>
                {solver.label}
              </Badge>
            </SettingRow>

            {overview.status === null ? null : (
              <SettingRow
                title={say('common.indexers')}
                description={
                  overview.status.indexers.total === 0
                    ? say('screens.adminArea.requestsPanel.noneYetAddOneOnThe')
                    : overview.status.indexers.failing.length === 0
                      ? say('screens.adminArea.requestsPanel.enabledOfTotalSwitchedOn', {
                          enabled: overview.status.indexers.enabled.toString(),
                          total: overview.status.indexers.total.toString(),
                        })
                      : say('screens.adminArea.requestsPanel.enabledOfTotalSwitchedOnFailures', {
                          enabled: overview.status.indexers.enabled.toString(),
                          total: overview.status.indexers.total.toString(),
                          failures: overview.status.indexers.failing
                            .map((one) =>
                              say('screens.adminArea.downloadsPanel.nameProblem', {
                                name: one.name,
                                problem: sayAgain(one.problem),
                              }),
                            )
                            .join(' '),
                        })
                }
              >
                {overview.status.indexers.failing.length > 0 ? (
                  <HowToFix
                    href={docsFor(
                      overview.status.indexers.failing.length === 1
                        ? overview.status.indexers.failing[0]?.problemCode
                        : null,
                    )}
                  />
                ) : null}

                {overview.status.indexers.failing.length > 0 ? (
                  <Badge size="sm" tone="warning">
                    {sayCount(
                      'screens.adminArea.requestsPanel.countFailing',
                      overview.status.indexers.failing.length,
                    )}
                  </Badge>
                ) : overview.status.indexers.total === 0 ? (
                  <Badge size="sm">{say('common.none')}</Badge>
                ) : (
                  <Badge size="sm" tone="success">
                    {say('common.working')}
                  </Badge>
                )}
              </SettingRow>
            )}
          </SettingList>
        </>
      )}
    </PanelCard>
  );
};

RequestsPanel.displayName = 'RequestsPanel';

export { RequestsPanel };
