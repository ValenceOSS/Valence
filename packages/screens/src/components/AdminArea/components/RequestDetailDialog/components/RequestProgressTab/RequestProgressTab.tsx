import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Spinner } from '@ValenceUI/Spinner';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { DownloadQueueTable } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/components/DownloadQueueTable/DownloadQueueTable';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import type { RequestProgressTabProps } from './RequestProgressTab.types';

/**
 * How a request is going: where it stands, what it is waiting on, which release was chosen for
 * each part of it and how well that scored, and — for whatever is coming down now — the download
 * itself, with its speed, how far it has got, how long is left and who it is coming from.
 *
 * The downloads are the ones the request's own parts are waiting on, picked out of the queue
 * rather than counted again here, so what this shows and what the Downloads page shows cannot
 * disagree.
 *
 * @param request - The request.
 * @param busyId - Which download is mid-action, so its controls wait.
 * @param onPause - Told to hold a download.
 * @param onResume - Told to let it go on.
 * @param onRemove - Told to take it out of the queue.
 * @param onFile - Told to file what has finished into a library.
 */
const RequestProgressTab = ({
  request,
  busyId,
  onPause,
  onResume,
  onRemove,
  onFile,
}: RequestProgressTabProps) => {
  const queue = useQuery(requestsQueries.downloadQueue());
  const libraries = useQuery(libraryQueries.all());
  const badge = describeRequestBadge(request);
  const said = describeRequestProgress(request);

  const waitingOn = new Set(
    request.items.flatMap((item) => (item.downloadId === null ? [] : [item.downloadId])),
  );
  const downloads = (queue.data?.downloads ?? []).filter((download) => waitingOn.has(download.id));
  const chosen = request.items.filter((item) => item.releaseTitle !== null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={badge.tone}>{badge.label}</Badge>
        {said === null ? null : <span className="text-sm text-text-muted">{said}</span>}
      </div>

      {badge.detail === null ? null : (
        <p className="break-words font-body text-sm text-text-muted">{badge.detail}</p>
      )}

      {request.refusedBecause === null ? null : (
        <p className="font-body text-sm text-text-muted">
          Refused because: <span className="text-text">{request.refusedBecause}</span>
        </p>
      )}

      {chosen.length === 0 ? null : (
        <section aria-label="What was chosen" className="flex flex-col gap-2">
          <h4 className="text-xs uppercase tracking-[0.16em] text-text-muted">What was chosen</h4>

          <ul className="flex flex-col gap-1.5">
            {chosen.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="text-text-muted">{item.title}</span>
                <span className="min-w-0 break-all text-text">{item.releaseTitle}</span>
                {item.score === null ? null : (
                  <span className="tabular-nums text-text-muted">
                    scored {item.score.toString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="What is coming down" className="flex flex-col gap-2">
        <h4 className="text-xs uppercase tracking-[0.16em] text-text-muted">What is coming down</h4>

        {queue.isPending ? (
          <Spinner isCentered label="Reading the downloads" size="sm" />
        ) : downloads.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            Nothing is downloading for this just now.
          </p>
        ) : (
          <DownloadQueueTable
            downloads={downloads}
            libraries={libraries.data ?? []}
            busyId={busyId}
            onFile={onFile}
            onPause={onPause}
            onResume={onResume}
            onRemove={onRemove}
          />
        )}
      </section>
    </div>
  );
};

RequestProgressTab.displayName = 'RequestProgressTab';

export { RequestProgressTab };
