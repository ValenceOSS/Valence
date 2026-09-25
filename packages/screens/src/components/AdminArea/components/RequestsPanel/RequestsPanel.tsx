import { docsFor } from '@ValenceCore/functions/docsFor';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { notify } from '@ValenceUI/notify';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { RefreshCw as RefreshCwIcon } from '@keyline-icons/react';
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
import { describeRequestsVpn } from './describeRequestsVpn';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * The requests service as whoever set it up sees it: what it is doing just now — what waits on
 * somebody, what is coming down and how fast, what is stuck and what arrived today — and then
 * whether the server can reach it, which release it is, and whether the VPN it downloads through
 * is up, with a way to ask again now rather than waiting for the next check.
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
        notify.worked(say('admin.requestsPanel.checked'));
      })
      .catch(() => {
        notify.failed(say('admin.requestsPanel.couldNotCheck'));

        return asked.refetch();
      })
      .finally(() => {
        setIsChecking(false);
      });
  };

  const overview = asked.data ?? null;
  const vpn = overview === null ? null : describeRequestsVpn(overview);

  return (
    <PanelCard
      title={say('admin.requestsPanel.heading')}
      isFlush
      actions={
        <PanelCardAction icon={RefreshCwIcon} isLoading={isChecking} onClick={checkNow}>
          {say('admin.requestsPanel.checkNow')}
        </PanelCardAction>
      }
    >
      {asked.isError ? (
        <CouldNotRead
          what={say('admin.requestsPanel.what')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : overview === null || vpn === null ? (
        <Spinner isCentered label={say('admin.requestsPanel.reading')} size="sm" />
      ) : (
        <>
          <SettingList>
            <SettingRow
              title={say('admin.requestsPanel.serviceTitle')}
              description={
                overview.checkedAt === null
                  ? say('admin.requestsPanel.notCheckedYet', { address: overview.address })
                  : overview.problem === null
                    ? say('admin.requestsPanel.lastChecked', {
                        address: overview.address,
                        when: saidWhen(overview.checkedAt),
                      })
                    : say('admin.requestsPanel.lastCheckedWithProblem', {
                        address: overview.address,
                        when: saidWhen(overview.checkedAt),
                        problem: overview.problem,
                      })
              }
            >
              {overview.checkedAt === null || overview.isReachable ? null : (
                <HowToFix href={docsFor(overview.problemCode ?? 'RequestsUnreachable')} />
              )}

              {overview.checkedAt === null ? (
                <Badge size="sm">{say('admin.requestsPanel.notChecked')}</Badge>
              ) : overview.isReachable ? (
                <Badge size="sm" tone="success">
                  {say('admin.requestsPanel.answering')}
                </Badge>
              ) : (
                <Badge size="sm" tone="danger">
                  {say('admin.requestsPanel.unreachable')}
                </Badge>
              )}
            </SettingRow>

            {overview.status === null ? null : (
              <SettingRow
                title={say('admin.requestsPanel.releaseTitle')}
                description={say('admin.requestsPanel.releaseDescription')}
              >
                <Badge size="sm">{overview.status.version}</Badge>
              </SettingRow>
            )}

            <SettingRow title={say('admin.requestsPanel.vpnTitle')} description={vpn.detail}>
              <HowToFix href={vpn.help} />

              <Badge size="sm" tone={vpn.tone}>
                {vpn.label}
              </Badge>
            </SettingRow>

            {overview.status === null ? null : (
              <SettingRow
                title={say('admin.requestsPanel.indexersTitle')}
                description={
                  overview.status.indexers.total === 0
                    ? say('admin.requestsPanel.noIndexers')
                    : [
                        say('admin.requestsPanel.switchedOn', {
                          enabled: overview.status.indexers.enabled,
                          total: overview.status.indexers.total,
                        }),
                        ...overview.status.indexers.failing.map((one) =>
                          say('admin.requestsPanel.indexerFailing', {
                            name: one.name,
                            problem: one.problem,
                          }),
                        ),
                      ].join(' ')
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
                      'admin.requestsPanel.failing',
                      overview.status.indexers.failing.length,
                    )}
                  </Badge>
                ) : overview.status.indexers.total === 0 ? (
                  <Badge size="sm">{say('admin.requestsPanel.none')}</Badge>
                ) : (
                  <Badge size="sm" tone="success">
                    {say('admin.requestsPanel.working')}
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
