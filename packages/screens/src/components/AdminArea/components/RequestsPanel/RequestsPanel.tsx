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
        notify.worked('Checked the requests.');
      })
      .catch(() => {
        notify.failed('The requests could not be checked.');

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
      title="Requests"
      isFlush
      actions={
        <PanelCardAction icon={RefreshCwIcon} isLoading={isChecking} onClick={checkNow}>
          Check now
        </PanelCardAction>
      }
    >
      {asked.isError ? (
        <CouldNotRead
          what="The requests service"
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : overview === null || vpn === null ? (
        <Spinner isCentered label="Reading the requests service" size="sm" />
      ) : (
        <>
          <SettingList>
            <SettingRow
              title="Requests service"
              description={
                overview.checkedAt === null
                  ? `Not checked yet. Looking for it at ${overview.address}.`
                  : `At ${overview.address}. Last checked ${saidWhen(overview.checkedAt)}.`
              }
            >
              {overview.checkedAt === null ? (
                <Badge size="sm">Not checked</Badge>
              ) : overview.isReachable ? (
                <Badge size="sm" tone="success">
                  Answering
                </Badge>
              ) : (
                <Badge size="sm" tone="danger">
                  Unreachable
                </Badge>
              )}
            </SettingRow>

            {overview.status === null ? null : (
              <SettingRow
                title="Release"
                description="Which version of the requests service is running."
              >
                <Badge size="sm">{overview.status.version}</Badge>
              </SettingRow>
            )}

            <SettingRow title="VPN" description={vpn.detail}>
              <Badge size="sm" tone={vpn.tone}>
                {vpn.label}
              </Badge>
            </SettingRow>

            {overview.status === null ? null : (
              <SettingRow
                title="Indexers"
                description={
                  overview.status.indexers.total === 0
                    ? 'None yet. Add one on the Indexers page to have something to search.'
                    : `${overview.status.indexers.enabled.toString()} of ${overview.status.indexers.total.toString()} switched on.${overview.status.indexers.failing.map((one) => ` ${one.name}: ${one.problem}`).join('')}`
                }
              >
                {overview.status.indexers.failing.length > 0 ? (
                  <Badge size="sm" tone="warning">
                    {`${overview.status.indexers.failing.length.toString()} failing`}
                  </Badge>
                ) : overview.status.indexers.total === 0 ? (
                  <Badge size="sm">None</Badge>
                ) : (
                  <Badge size="sm" tone="success">
                    Working
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
