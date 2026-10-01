import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  changeDownloadClient,
  removeDownloadClient,
  testDownloadClient,
} from '@ValenceClient/requests/fetchDownloadClients';
import {
  fileQueuedDownload,
  pauseQueuedDownload,
  removeQueuedDownload,
  resumeQueuedDownload,
  watchDownloadQueue,
} from '@ValenceClient/requests/fetchDownloadQueue';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { DownloadClientDialog } from '@ValenceScreens/components/AdminArea/components/DownloadClientDialog/DownloadClientDialog';
import { RemoveDownloadDialog } from '@ValenceScreens/components/AdminArea/components/RemoveDownloadDialog/RemoveDownloadDialog';
import { DownloadClientsTable } from './components/DownloadClientsTable/DownloadClientsTable';
import { DownloadQueueTable } from './components/DownloadQueueTable/DownloadQueueTable';
import { ArrQueueTable } from './components/ArrQueueTable/ArrQueueTable';
import { GiveUpRulesList } from './components/GiveUpRulesList/GiveUpRulesList';
import { describeSpeeds } from './describeSpeeds';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import { say } from '@ValenceI18n/say';

const DOWNLOADS_TABS = ['queue', 'apps', 'clients', 'rules'] as const;

const NO_LIBRARIES: readonly Library[] = [];

type DownloadsTab = (typeof DOWNLOADS_TABS)[number];

/**
 * Whether a string the tab row handed back names one of this page's tabs.
 *
 * @param value - What was chosen.
 * @returns Whether it names a tab.
 */
const isDownloadsTab = (value: string): value is DownloadsTab =>
  DOWNLOADS_TABS.some((tab) => tab === value);

/**
 * The Downloads page: everything Valence has sent to a download client, moving as it downloads, what
 * each connected Radarr, Sonarr and Lidarr has in its own queue, the clients themselves, and when a
 * download is given up on.
 *
 * The queue is read once and then kept up to date by the live connection. Holding that open is also
 * what tells the requests service somebody is watching, so the clients are asked every couple of
 * seconds only while this page is on screen.
 *
 * Whatever the server said went wrong is shown above the tables rather than swallowed, and both are
 * read again after anything is done so what they show is what the service now holds.
 */
const DownloadsPanel = () => {
  const cache = useQueryClient();
  const queue = useQuery(requestsQueries.downloadQueue());
  const clients = useQuery(requestsQueries.downloadClients());
  const [tab, setTab] = useState<DownloadsTab>('queue');
  const travel = useTravelDirection([...DOWNLOADS_TABS], tab);
  const [editing, setEditing] = useState<DownloadClient | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [removingClient, setRemovingClient] = useState<DownloadClient | null>(null);
  const [removingDownload, setRemovingDownload] = useState<QueuedDownload | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const libraries = useQuery(libraryQueries.all());
  const [problem, setProblem] = useState<string | null>(null);
  const apps = useQuery(requestsQueries.arrApps());
  const hasFulfillingApps = (apps.data ?? []).some((app) => app.kind !== 'prowlarr');
  const arrQueue = useQuery(requestsQueries.arrQueue(tab === 'apps'));

  useEffect(
    () =>
      watchDownloadQueue((next) => {
        cache.setQueryData(requestsQueries.downloadQueue().queryKey, next);
      }),
    [cache],
  );

  const reread = useCallback(
    () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: requestsQueries.downloadClients().queryKey }),
        cache.invalidateQueries({ queryKey: requestsQueries.downloadQueue().queryKey }),
      ]),
    [cache],
  );

  const act = useCallback(
    (
      download: QueuedDownload,
      doing: (id: string) => Promise<{ refusal: { message: string } | null }>,
      done: string,
    ) => {
      setBusyId(download.id);
      setProblem(null);

      void doing(download.id)
        .then(({ refusal }) => {
          tellOutcome(done, failureOfRefusal(refusal));
          setProblem(refusal?.message ?? null);
        })
        .then(reread)
        .finally(() => {
          setBusyId(null);
        });
    },
    [reread],
  );

  const pause = useCallback(
    (download: QueuedDownload) => {
      act(
        download,
        pauseQueuedDownload,
        say('screens.adminArea.downloadsPanel.pausedTitle', { title: download.title }),
      );
    },
    [act],
  );

  const file = useCallback(
    (download: QueuedDownload, libraryId: string) => {
      act(
        download,
        (id) => fileQueuedDownload(id, libraryId),
        say('screens.adminArea.downloadsPanel.filedTitle', { title: download.title }),
      );
    },
    [act],
  );

  const resume = useCallback(
    (download: QueuedDownload) => {
      act(
        download,
        resumeQueuedDownload,
        say('screens.adminArea.downloadsPanel.resumedTitle', { title: download.title }),
      );
    },
    [act],
  );

  const test = useCallback(
    (client: DownloadClient) => {
      setTestingId(client.id);
      setProblem(null);

      void testDownloadClient(client.id)
        .then(({ value, refusal }) => {
          const problem = value?.isWorking === false ? sayAgainIfAny(value.problem) : null;
          const failure =
            refusal?.message ??
            (value?.isWorking === false
              ? problem === null
                ? say('screens.adminArea.downloadsPanel.nameDidNotAnswer', { name: client.name })
                : say('screens.adminArea.downloadsPanel.nameProblem', {
                    name: client.name,
                    problem,
                  })
              : null);

          tellOutcome(say('common.nameAnswered', { name: client.name }), failure);
          setProblem(failure);
        })
        .then(reread)
        .finally(() => {
          setTestingId(null);
        });
    },
    [reread],
  );

  const switchOnOrOff = useCallback(
    (client: DownloadClient) => {
      setProblem(null);

      void changeDownloadClient(client.id, { isEnabled: !client.isEnabled })
        .then(({ refusal }) => {
          tellOutcome(
            client.isEnabled
              ? say('common.turnedOffName', { name: client.name })
              : say('common.turnedOnName', { name: client.name }),
            failureOfRefusal(refusal),
          );
          setProblem(refusal?.message ?? null);
        })
        .then(reread);
    },
    [reread],
  );

  const readings = queue.data?.clients ?? [];
  const reachable = readings.filter((reading) => reading.isEnabled && reading.isReachable);
  const total =
    reachable.length === 0
      ? null
      : describeSpeeds(
          reachable.reduce((sum, reading) => sum + (reading.downloadBytesPerSecond ?? 0), 0),
          reachable.some((reading) => reading.uploadBytesPerSecond !== null)
            ? reachable.reduce((sum, reading) => sum + (reading.uploadBytesPerSecond ?? 0), 0)
            : null,
        );
  const removingKind = readings.find((reading) => reading.id === removingDownload?.clientId)?.kind;

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        if (isDownloadsTab(next)) {
          setTab(next);
        }
      }}
    >
      <PanelCard
        title={say('common.downloads')}
        isFlush
        actions={
          <>
            {total === null ? null : (
              <span className="text-xs tabular-nums text-text-muted">{total}</span>
            )}

            <PanelCardAction
              icon={PlusIcon}
              onClick={() => {
                setIsAdding(true);
              }}
            >
              {say('common.addADownloadClient')}
            </PanelCardAction>
          </>
        }
        below={
          <TabRow
            label={say('screens.adminArea.downloadsPanel.whatToShowAboutDownloads')}
            tone="underlined"
            size="sm"
            value={tab}
            groups={[
              {
                items: [
                  { id: 'queue', label: say('common.queue') },
                  ...(hasFulfillingApps
                    ? [{ id: 'apps', label: say('screens.adminArea.arrAppsPanel.connectedApps') }]
                    : []),
                  { id: 'clients', label: say('screens.adminArea.downloadsPanel.clients') },
                  { id: 'rules', label: say('screens.adminArea.downloadsPanel.rules') },
                ],
              },
            ]}
          />
        }
      >
        <DownloadClientDialog
          isOpen={isAdding || editing !== null}
          client={editing}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            void reread();
          }}
        />

        <ConfirmDialog
          title={
            removingClient === null
              ? say('screens.adminArea.downloadsPanel.removeThisClient')
              : say('common.removeName', { name: removingClient.name })
          }
          detail={say('screens.adminArea.downloadsPanel.nothingWillBeSentToIt')}
          confirmLabel={say('common.remove')}
          isDestructive
          isOpen={removingClient !== null}
          onClose={() => {
            setRemovingClient(null);
          }}
          onConfirm={() => {
            const gone = removingClient;

            setRemovingClient(null);

            if (gone !== null) {
              void removeDownloadClient(gone.id)
                .then((refusal) => {
                  tellOutcome(
                    say('common.removedName', { name: gone.name }),
                    failureOfRefusal(refusal),
                  );
                  setProblem(refusal?.message ?? null);
                })
                .then(reread);
            }
          }}
        />

        <RemoveDownloadDialog
          download={removingDownload}
          keepsFinishedFiles={removingKind === 'nzbget' && removingDownload?.state === 'done'}
          onClose={() => {
            setRemovingDownload(null);
          }}
          onConfirm={(deleteData) => {
            const gone = removingDownload;

            setRemovingDownload(null);

            if (gone !== null) {
              act(
                gone,
                async (id) => ({ refusal: await removeQueuedDownload(id, deleteData) }),
                say('screens.adminArea.downloadsPanel.removedTitle', { title: gone.title }),
              );
            }
          }}
        />

        {problem === null ? null : (
          <p role="alert" className="px-4 pt-3 text-sm text-danger">
            {problem}
          </p>
        )}

        <TabPanel value="queue" travel={travel}>
          {queue.isError ? (
            <CouldNotRead
              said={say('screens.adminArea.downloadsPanel.theDownloadsCouldNotBeRead')}
              isTryingAgain={queue.isFetching}
              onTryAgain={() => {
                void queue.refetch();
              }}
            />
          ) : queue.isPending ? (
            <Spinner isCentered label={say('common.readingTheDownloads')} size="sm" />
          ) : (
            <DownloadQueueTable
              fillsScreen
              downloads={queue.data.downloads}
              libraries={libraries.data ?? NO_LIBRARIES}
              busyId={busyId}
              onFile={file}
              onPause={pause}
              onResume={resume}
              onRemove={setRemovingDownload}
            />
          )}
        </TabPanel>

        <TabPanel value="apps" travel={travel}>
          {arrQueue.isError ? (
            <CouldNotRead
              said={say('screens.adminArea.downloadsPanel.theConnectedAppsQueuesCouldNot')}
              isTryingAgain={arrQueue.isFetching}
              onTryAgain={() => {
                void arrQueue.refetch();
              }}
            />
          ) : arrQueue.isPending ? (
            <Spinner
              isCentered
              label={say('screens.adminArea.downloadsPanel.readingTheConnectedAppsQueues')}
              size="sm"
            />
          ) : (
            <ArrQueueTable queue={arrQueue.data} />
          )}
        </TabPanel>

        <TabPanel value="clients" travel={travel}>
          {clients.isError ? (
            <CouldNotRead
              said={say('screens.adminArea.downloadsPanel.theDownloadClientsCouldNotBeRead')}
              isTryingAgain={clients.isFetching}
              onTryAgain={() => {
                void clients.refetch();
              }}
            />
          ) : clients.isPending ? (
            <Spinner
              isCentered
              label={say('screens.adminArea.downloadsPanel.readingTheDownloadClients')}
              size="sm"
            />
          ) : (
            <DownloadClientsTable
              clients={clients.data}
              readings={readings}
              testingId={testingId}
              onChange={setEditing}
              onTest={test}
              onSwitch={switchOnOrOff}
              onRemove={setRemovingClient}
            />
          )}
        </TabPanel>

        <TabPanel value="rules" travel={travel}>
          <GiveUpRulesList />
        </TabPanel>
      </PanelCard>
    </Tabs>
  );
};

DownloadsPanel.displayName = 'DownloadsPanel';

export { DownloadsPanel };
