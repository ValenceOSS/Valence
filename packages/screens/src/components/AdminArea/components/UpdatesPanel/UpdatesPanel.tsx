import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw as RefreshCwFilledIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Callout } from '@ValenceUI/Callout';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { fetchUpdateCheck } from '@ValenceClient/admin/fetchUpdateCheck';
import { CopyableAddress } from '@ValenceScreens/components/CopyableAddress/CopyableAddress';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { StatStrip } from '@ValenceScreens/components/AdminArea/components/StatStrip/StatStrip';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { DOCKER_COMMANDS } from '@ValenceScreens/admin/DOCKER_COMMANDS';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { say } from '@ValenceI18n/say';
import { ReleaseEntry } from './components/ReleaseEntry/ReleaseEntry';

/**
 * Whether this server runs the newest release of Valence: which it runs, which is newest and when it
 * came out, what changed in it and in the releases before it, and the commands that update a server running in Docker. Checking
 * can be asked for again at once; a server told not to check says so instead.
 */
const UpdatesPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.updateCheck());
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const [isChecking, setIsChecking] = useState(false);
  const check = asked.data;
  const releases =
    check === undefined
      ? []
      : check.history.length > 0
        ? check.history
        : check.latest === null || check.url === null
          ? []
          : [
              {
                version: check.latest,
                publishedAt: check.publishedAt,
                notes: check.notes,
                url: check.url,
                isNewer: check.isNewer,
                isCurrent: !check.isNewer,
              },
            ];

  const checkNow = () => {
    setIsChecking(true);

    void fetchUpdateCheck(true)
      .then((fresh) => {
        cache.setQueryData(adminQueries.updateCheck().queryKey, fresh);
      })
      .finally(() => {
        setIsChecking(false);
      });
  };

  useAdminCommand('checkForUpdates', checkNow);

  if (asked.isError) {
    return (
      <CouldNotRead
        said={say('screens.adminArea.updatesPanel.whetherAnUpdateIsOutCouldNotBeRead')}
        isTryingAgain={asked.isFetching}
        onTryAgain={() => {
          void asked.refetch();
        }}
      />
    );
  }

  if (check === undefined) {
    return (
      <Spinner
        isCentered
        size="sm"
        label={say('screens.adminArea.updatesPanel.lookingForUpdates')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StatStrip
        stats={[
          {
            label: say('screens.adminArea.updatesPanel.thisServerRuns'),
            value: check.current,
            detail: check.isNewer ? (
              <Badge size="sm" tone="warning">
                {say('screens.adminArea.updatesPanel.anUpdateIsOut')}
              </Badge>
            ) : check.latest === null ? undefined : (
              <Badge size="sm" tone="success">
                {say('common.upToDate')}
              </Badge>
            ),
          },
          {
            label: say('screens.adminArea.updatesPanel.newestRelease'),
            value: check.latest ?? '—',
            ...(check.publishedAt === null
              ? {}
              : {
                  detail: say('screens.adminArea.updatesPanel.cameOutWhen', {
                    when: describeSince(check.publishedAt, now),
                  }),
                }),
          },
          {
            label: say('screens.adminArea.updatesPanel.lastChecked'),
            value: describeSince(check.checkedAt, now),
          },
        ]}
      />

      {check.isEnabled ? null : (
        <Callout title={say('screens.adminArea.updatesPanel.checkingForUpdatesIsOff')}>
          {say('screens.adminArea.updatesPanel.thisServerWasStartedWithChecksOff')}
        </Callout>
      )}

      {check.problem === null ? null : (
        <Callout tone="warning" title={say('screens.adminArea.updatesPanel.couldNotCheck')}>
          {sayAgain(check.problem)}
        </Callout>
      )}

      {check.isNewer ? (
        <PanelCard title={say('screens.adminArea.updatesPanel.howToUpdate')}>
          <ol className="flex flex-col gap-3">
            <li>
              <CopyableAddress
                title={say('screens.adminArea.updatesPanel.fetchTheNewRelease')}
                detail={say('screens.adminArea.restoreBackupDialog.runThisBesideYourComposeFile')}
                address={DOCKER_COMMANDS.pull}
              />
            </li>
            <li>
              <CopyableAddress
                title={say('screens.adminArea.updatesPanel.startItInPlaceOfThisOne')}
                detail={say(
                  'screens.adminArea.updatesPanel.aBackupIsTakenBeforeTheDatabaseChanges',
                )}
                address={DOCKER_COMMANDS.start}
              />
            </li>
          </ol>
        </PanelCard>
      ) : null}

      <PanelCard
        title={say('ui.siteFooter.changelog')}
        actions={
          check.isEnabled ? (
            <PanelCardAction
              icon={RefreshCwFilledIcon}
              onClick={checkNow}
              isLoading={isChecking}
              isDisabled={isChecking}
            >
              {say('screens.adminArea.requestsPanel.checkNow')}
            </PanelCardAction>
          ) : undefined
        }
      >
        {releases.length === 0 ? (
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.updatesPanel.noReleaseNotesYet')}
          </p>
        ) : (
          <ul className="-mx-2 -my-1 flex flex-col divide-y divide-[var(--surface-line)]">
            {releases.map((release, index) => (
              <ReleaseEntry
                key={release.version}
                release={release}
                isOpenAtFirst={index === 0}
                now={now}
              />
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
};

UpdatesPanel.displayName = 'UpdatesPanel';

export { UpdatesPanel };
