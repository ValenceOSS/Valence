import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  pauseQueuedDownload,
  removeQueuedDownload,
  resumeQueuedDownload,
  fileQueuedDownload,
} from '@ValenceClient/requests/fetchDownloadQueue';
import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { RequestBlocklistTab } from './components/RequestBlocklistTab/RequestBlocklistTab';
import { RequestHistoryTab } from './components/RequestHistoryTab/RequestHistoryTab';
import { RequestProgressTab } from './components/RequestProgressTab/RequestProgressTab';
import { RequestReleasesTab } from './components/RequestReleasesTab/RequestReleasesTab';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { RequestDetailDialogProps, RequestDetailTab } from './RequestDetailDialog.types';

const TABS: readonly { id: RequestDetailTab; label: string }[] = [
  { id: 'going', label: 'How it is going' },
  { id: 'releases', label: 'Releases' },
  { id: 'history', label: 'What it has done' },
  { id: 'blocked', label: 'Never again' },
];

const TAB_IDS = TABS.map((tab) => tab.id);

/**
 * Whether what a tab row said is a tab of this dialog.
 *
 * @param value - What it said.
 * @returns Whether it is one.
 */
const isDetailTab = (value: string): value is RequestDetailTab =>
  TAB_IDS.some((tab) => tab === value);

/**
 * Everything about one request in one place: how it is going and what is coming down for it, every
 * release the indexers have for it and how each was judged, everything it has done, and what it
 * has given up on.
 *
 * A dialog rather than a page of its own because a request is read from the list of them and
 * closed back to it — the list keeps reading while this is open, so what it says stays true.
 *
 * @param request - The request, or nothing while the dialog is closed.
 * @param openOn - Which tab to open on, for a menu that leads straight to one of them.
 * @param onClose - Called when it is dismissed.
 * @param onChanged - Told when something about the request changed, so the list reads again.
 */
const RequestDetailDialog = ({
  request,
  openOn = 'going',
  onClose,
  onChanged,
}: RequestDetailDialogProps) => {
  const cache = useQueryClient();
  const [tab, setTab] = useState<RequestDetailTab>(openOn);
  const [opened, setOpened] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const travel = useTravelDirection([...TAB_IDS], tab);

  const rereadDownloads = () =>
    cache.invalidateQueries({ queryKey: requestsQueries.downloadQueue().queryKey });

  const onDownload = (id: string, doing: () => Promise<{ refusal: Refusal } | Refusal>) => {
    setBusyId(id);

    void doing()
      .then(rereadDownloads)
      .then(onChanged)
      .finally(() => {
        setBusyId(null);
      });
  };

  if (request !== null && request.id !== opened) {
    setOpened(request.id);
    setTab(openOn);
  }

  const title = request === null ? 'A request' : request.title;

  return (
    <DialogCompanion label={title} isOpen={request !== null} size="stage" onClose={onClose}>
      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (isDetailTab(next)) {
            setTab(next);
          }
        }}
      >
        <DialogTitle
          size="compact"
          title={title}
          {...(request === null
            ? {}
            : {
                detail: `${REQUEST_KIND_NAMES[request.kind]} · requested by ${request.requestedBy.name}`,
              })}
          below={
            <TabRow
              label="What to show about this request"
              tone="underlined"
              size="sm"
              value={tab}
              groups={[{ items: [...TABS] }]}
            />
          }
        />

        <DialogContent className="flex min-h-0 flex-col overflow-y-auto">
          {request === null ? null : (
            <>
              <TabPanel value="going" travel={travel}>
                <RequestProgressTab
                  request={request}
                  busyId={busyId}
                  onPause={(download) => {
                    onDownload(download.id, () => pauseQueuedDownload(download.id));
                  }}
                  onResume={(download) => {
                    onDownload(download.id, () => resumeQueuedDownload(download.id));
                  }}
                  onRemove={(download) => {
                    onDownload(download.id, () => removeQueuedDownload(download.id, false));
                  }}
                  onFile={(download, libraryId) => {
                    onDownload(download.id, () => fileQueuedDownload(download.id, libraryId));
                  }}
                />
              </TabPanel>

              <TabPanel value="releases" travel={travel}>
                <RequestReleasesTab request={request} onPicked={onChanged} />
              </TabPanel>

              <TabPanel value="history" travel={travel}>
                <RequestHistoryTab request={request} />
              </TabPanel>

              <TabPanel value="blocked" travel={travel}>
                <RequestBlocklistTab request={request} onLifted={onChanged} />
              </TabPanel>
            </>
          )}
        </DialogContent>

        <DialogFooter dismiss={{ onChoose: onClose }} />
      </Tabs>
    </DialogCompanion>
  );
};

RequestDetailDialog.displayName = 'RequestDetailDialog';

export { RequestDetailDialog };
