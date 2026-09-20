import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
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
import { describeSpeeds } from './describeSpeeds';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

const DOWNLOADS_TABS = ['queue', 'clients'] as const;

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
 * The Downloads page: everything Valence has sent to a download client, moving as it downloads, and
 * the clients themselves.
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
    ) => {
      setBusyId(download.id);
      setProblem(null);

      void doing(download.id)
        .then(({ refusal }) => {
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
      act(download, pauseQueuedDownload);
    },
    [act],
  );

  const file = useCallback(
    (download: QueuedDownload, libraryId: string) => {
      act(download, (id) => fileQueuedDownload(id, libraryId));
    },
    [act],
  );

  const resume = useCallback(
    (download: QueuedDownload) => {
      act(download, resumeQueuedDownload);
    },
    [act],
  );

  const test = useCallback(
    (client: DownloadClient) => {
      setTestingId(client.id);
      setProblem(null);

      void testDownloadClient(client.id)
        .then(({ value, refusal }) => {
          setProblem(
            refusal?.message ??
              (value?.isWorking === false
                ? `${client.name}: ${value.problem ?? 'did not answer'}`
                : null),
          );
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
        title="Downloads"
        isFlush
        actions={
          <>
            {total === null ? null : (
              <span className="text-xs tabular-nums text-text-muted">{total}</span>
            )}

            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setIsAdding(true);
              }}
            >
              Add a download client
            </Button>
          </>
        }
        below={
          <TabRow
            label="What to show about downloads"
            tone="underlined"
            size="sm"
            value={tab}
            groups={[
              {
                items: [
                  { id: 'queue', label: 'Queue' },
                  { id: 'clients', label: 'Clients' },
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
          title={`Remove ${removingClient?.name ?? 'this client'}?`}
          detail="Nothing will be sent to it again, and Valence stops following what it already sent there. What it is downloading carries on in the client."
          confirmLabel="Remove"
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
              act(gone, async (id) => ({ refusal: await removeQueuedDownload(id, deleteData) }));
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
              what="The downloads"
              isTryingAgain={queue.isFetching}
              onTryAgain={() => {
                void queue.refetch();
              }}
            />
          ) : queue.isPending ? (
            <Spinner isCentered label="Reading the downloads" size="sm" />
          ) : (
            <DownloadQueueTable
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

        <TabPanel value="clients" travel={travel}>
          {clients.isError ? (
            <CouldNotRead
              what="The download clients"
              isTryingAgain={clients.isFetching}
              onTryAgain={() => {
                void clients.refetch();
              }}
            />
          ) : clients.isPending ? (
            <Spinner isCentered label="Reading the download clients" size="sm" />
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
      </PanelCard>
    </Tabs>
  );
};

DownloadsPanel.displayName = 'DownloadsPanel';

export { DownloadsPanel };
