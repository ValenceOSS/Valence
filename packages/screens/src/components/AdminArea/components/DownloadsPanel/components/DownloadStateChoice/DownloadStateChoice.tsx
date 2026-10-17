import { PanelCardChoice } from '@ValenceScreens/components/PanelCardChoice/PanelCardChoice';
import {
  QUEUED_DOWNLOAD_STATES,
  QueuedDownloadStateSchema,
} from '@ValenceContracts/schemas/DownloadQueue';
import type { QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';
import { say } from '@ValenceI18n/say';
import type { DownloadStateChoiceProps } from './DownloadStateChoice.types';

const EVERY_STATE = 'all';

const STATE_NAMES: Readonly<Record<QueuedDownloadState, string>> = {
  queued: say('screens.downloadsPanel.downloadStateChoice.queued'),
  metadata: say('screens.downloadsPanel.describeDownloadState.fetchingMetadata'),
  downloading: say('screens.downloadsPanel.downloadStateChoice.downloading'),
  stalled: say('screens.downloadsPanel.downloadStateChoice.stalled'),
  paused: say('screens.downloadsPanel.downloadStateChoice.paused'),
  processing: say('screens.downloadsPanel.downloadStateChoice.processing'),
  done: say('screens.downloadsPanel.downloadStateChoice.done'),
  failed: say('screens.downloadsPanel.downloadStateChoice.failed'),
};

/**
 * Narrows the download queue to the downloads in one state, each choice saying how many are in it;
 * states nothing is in are left out, so the list is only what can be chosen.
 *
 * @param downloads - Every download in the queue.
 * @param value - The state narrowed to, or null for every one.
 * @param onChange - Told which state was chosen, or null for every one.
 */
const DownloadStateChoice = ({ downloads, value, onChange }: DownloadStateChoiceProps) => {
  const countOf = (state: QueuedDownloadState) =>
    downloads.filter((download) => download.state === state).length;

  return (
    <PanelCardChoice
      label={say('screens.downloadsPanel.downloadStateChoice.whichDownloads')}
      options={[
        {
          id: EVERY_STATE,
          label: say('screens.downloadsPanel.downloadStateChoice.everyState', {
            count: downloads.length.toLocaleString(),
          }),
        },
        ...QUEUED_DOWNLOAD_STATES.filter((state) => state === value || countOf(state) > 0).map(
          (state) => ({
            id: state,
            label: say('screens.downloadsPanel.downloadStateChoice.stateCount', {
              state: STATE_NAMES[state],
              count: countOf(state).toLocaleString(),
            }),
          }),
        ),
      ]}
      value={value ?? EVERY_STATE}
      onSelect={(id) => {
        const state = QueuedDownloadStateSchema.safeParse(id);

        onChange(state.success ? state.data : null);
      }}
    />
  );
};

DownloadStateChoice.displayName = 'DownloadStateChoice';

export { DownloadStateChoice };
