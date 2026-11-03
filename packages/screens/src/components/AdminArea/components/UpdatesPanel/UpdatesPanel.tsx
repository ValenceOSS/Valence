import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown as ChevronDownFilledIcon,
  ChevronUp as ChevronUpFilledIcon,
  RefreshCw as RefreshCwFilledIcon,
} from '@keyline-icons/react/fill';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
import {
  readUpdateStepsShown,
  saveUpdateStepsShown,
} from '@ValenceScreens/admin/updateStepsPreference';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { say } from '@ValenceI18n/say';
import { ReleaseEntry } from './components/ReleaseEntry/ReleaseEntry';
import { DevBuildCard } from './components/DevBuildCard/DevBuildCard';

/**
 * Whether this server runs the newest release of Valence, or for a dev build the newest dev build:
 * which it runs, which is newest and when it came out, what changed since, and the commands that
 * update a server running in Docker. Checking can be asked for again at once; a server told not to
 * check says so instead.
 */
const UpdatesPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.updateCheck());
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const [isChecking, setIsChecking] = useState(false);
  const [areStepsShown, setAreStepsShown] = useState(readUpdateStepsShown);
  const isStill = useReducedMotion() === true;
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

  const dev = check.dev;
  const isBehind = check.isNewer || dev?.isNewer === true;

  return (
    <div className="flex flex-col gap-4">
      <StatStrip
        stats={[
          {
            label: say('screens.adminArea.updatesPanel.thisServerRuns'),
            value: check.current,
            detail: isBehind ? (
              <Badge size="sm" tone="warning">
                {say('screens.adminArea.updatesPanel.anUpdateIsOut')}
              </Badge>
            ) : check.latest === null && (dev?.newest ?? null) === null ? undefined : (
              <Badge size="sm" tone="success">
                {say('common.upToDate')}
              </Badge>
            ),
          },
          ...(dev === null
            ? []
            : [
                {
                  label: say('screens.adminArea.updatesPanel.newestDevBuild'),
                  value: dev.newest ?? '—',
                  ...(dev.builtAt === null
                    ? {}
                    : {
                        detail: say('screens.adminArea.updatesPanel.builtWhen', {
                          when: describeSince(dev.builtAt, now),
                        }),
                      }),
                },
              ]),
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

      {(dev?.problem ?? null) === null || dev === null ? null : (
        <Callout
          tone="warning"
          title={say('screens.adminArea.updatesPanel.couldNotCheckForADevBuild')}
        >
          {dev.problem === null ? null : sayAgain(dev.problem)}
        </Callout>
      )}

      {isBehind ? (
        <PanelCard
          title={say('screens.adminArea.updatesPanel.howToUpdate')}
          actions={
            <PanelCardAction
              icon={areStepsShown ? ChevronUpFilledIcon : ChevronDownFilledIcon}
              onClick={() => {
                setAreStepsShown(!areStepsShown);
                saveUpdateStepsShown(!areStepsShown);
              }}
            >
              {areStepsShown ? say('common.hide') : say('common.show')}
            </PanelCardAction>
          }
        >
          {areStepsShown ? null : (
            <p className="text-sm text-text-muted">
              {say('screens.adminArea.updatesPanel.runPullThenStart', {
                pull: DOCKER_COMMANDS.pull,
                start: DOCKER_COMMANDS.start,
              })}
            </p>
          )}

          <AnimatePresence initial={false}>
            {areStepsShown ? (
              <motion.div
                key="steps"
                initial={isStill ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={isStill ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                exit={isStill ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: isStill ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                {dev?.isNewer === true ? (
                  <p className="pb-3 text-sm text-text-muted">
                    {say('screens.adminArea.updatesPanel.useTheDevTag')}
                  </p>
                ) : null}

                <ol className="flex flex-col gap-3">
                  <li>
                    <CopyableAddress
                      title={
                        dev?.isNewer === true
                          ? say('screens.adminArea.updatesPanel.fetchTheNewestDevBuild')
                          : say('screens.adminArea.updatesPanel.fetchTheNewRelease')
                      }
                      detail={say(
                        'screens.adminArea.restoreBackupDialog.runThisBesideYourComposeFile',
                      )}
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
              </motion.div>
            ) : null}
          </AnimatePresence>
        </PanelCard>
      ) : null}

      {dev?.isNewer === true && dev.commits.length > 0 ? (
        <DevBuildCard dev={dev} now={now} />
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
