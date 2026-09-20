import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Download04Icon,
  InboxDownloadIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { StatTile } from '@ValenceUI/StatTile';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { RequestsWorkTilesProps } from './RequestsWorkTiles.types';

/**
 * What requesting is doing just now, as four tiles across the top of its page: what is waiting on
 * somebody, what is being fetched and how fast, what has gone wrong, and what arrived today.
 *
 * They are what an operator opens this page to find out, which is why they are above the settings
 * rather than under them.
 *
 * @param work - What the server last counted.
 */
const RequestsWorkTiles = ({ work }: RequestsWorkTilesProps) => (
  <div className="grid gap-3 px-4 pb-1 sm:grid-cols-2 xl:grid-cols-4">
    <StatTile
      label="Waiting on approval"
      value={work.awaitingApproval.toString()}
      detail={
        work.awaitingApproval === 0 ? 'Nothing to answer.' : 'Answer them on the Requested page.'
      }
      icon={<Icon of={InboxDownloadIcon} size={18} />}
    />

    <StatTile
      label="Coming down"
      value={work.downloading.toString()}
      detail={
        work.downloadBytesPerSecond === 0
          ? work.searching === 0
            ? 'Nothing is being fetched.'
            : `${work.searching.toString()} still being looked for.`
          : `${formatBytes(work.downloadBytesPerSecond)}/s between them.`
      }
      icon={<Icon of={Download04Icon} size={18} />}
    />

    <StatTile
      label="Stuck"
      value={work.failed.toString()}
      detail={
        work.clients.failing.length === 0
          ? work.failed === 0
            ? 'Nothing has failed.'
            : 'Try them again from the Requested page.'
          : `${work.clients.failing.map((client) => client.name).join(', ')} not answering.`
      }
      icon={<Icon of={Alert02Icon} size={18} />}
    />

    <StatTile
      label="Arrived today"
      value={work.arrivedToday.toString()}
      detail={`${work.clients.reachable.toString()} of ${work.clients.total.toString()} download clients answering.`}
      icon={<Icon of={CheckmarkCircle02Icon} size={18} />}
    />
  </div>
);

RequestsWorkTiles.displayName = 'RequestsWorkTiles';

export { RequestsWorkTiles };
