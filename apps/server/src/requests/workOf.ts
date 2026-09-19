import type { DownloadClientState, QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestsWork } from '@ValenceContracts/schemas/Requests';

const GOING = new Set(['chosen', 'downloading', 'filing']);

const SEARCHING = new Set(['wanted', 'waiting', 'searching']);

/**
 * What requesting is doing just now, as the overview shows it: how much is waiting on somebody,
 * how much is being looked for, how much is coming down and how fast, what has gone wrong, what
 * arrived today, and which download clients are answering.
 *
 * Counted from the requests themselves rather than kept anywhere, since both answers are read
 * afresh whenever the overview is drawn, and two counts that can disagree are worse than one.
 *
 * @param requests - Every request.
 * @param queue - What the download clients are doing.
 * @param today - The day to count arrivals against, as an ISO date.
 * @returns The summary.
 */
const workOf = (
  requests: readonly Pick<MediaRequest, 'state' | 'approval' | 'updatedAt'>[],
  queue: {
    clients: readonly Pick<DownloadClientState, 'name' | 'isReachable' | 'isEnabled' | 'problem'>[];
    downloads: readonly Pick<QueuedDownload, 'downloadBytesPerSecond'>[];
  } | null,
  today: string,
): RequestsWork => {
  const clients = queue?.clients ?? [];
  const enabled = clients.filter((client) => client.isEnabled);

  return {
    awaitingApproval: requests.filter((request) => request.approval === 'awaiting').length,
    searching: requests.filter((request) => SEARCHING.has(request.state)).length,
    downloading: requests.filter((request) => GOING.has(request.state)).length,
    failed: requests.filter((request) => request.state === 'failed').length,
    arrivedToday: requests.filter(
      (request) => request.state === 'available' && request.updatedAt.startsWith(today),
    ).length,
    downloadBytesPerSecond: (queue?.downloads ?? []).reduce(
      (total, download) => total + (download.downloadBytesPerSecond ?? 0),
      0,
    ),
    clients: {
      total: enabled.length,
      reachable: enabled.filter((client) => client.isReachable).length,
      failing: enabled
        .filter((client) => !client.isReachable)
        .map((client) => ({ name: client.name, problem: client.problem ?? 'It is not answering' })),
    },
  };
};

export { workOf };
