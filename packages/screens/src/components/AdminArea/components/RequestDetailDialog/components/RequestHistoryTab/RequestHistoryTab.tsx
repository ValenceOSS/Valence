import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import type { RequestHistoryTabProps } from './RequestHistoryTab.types';

const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/**
 * What a request has done, newest first: every search, how many releases it found and how many
 * were for it, what was chosen or why none would do, which indexers could not answer, and what
 * became of each download. It is read again every few seconds, so a search can be followed as it
 * goes.
 *
 * @param request - The request.
 */
const RequestHistoryTab = ({ request }: RequestHistoryTabProps) => {
  const said = useQuery(requestsQueries.mediaRequestLog(request.id));

  if (said.isError) {
    return (
      <CouldNotRead
        what="What it has done"
        isTryingAgain={said.isFetching}
        onTryAgain={() => {
          void said.refetch();
        }}
      />
    );
  }

  if (said.data === undefined) {
    return <Spinner label="Reading what it has done" size="sm" />;
  }

  if (said.data.length === 0) {
    return <p className="font-body text-sm text-text-muted">Nothing yet.</p>;
  }

  return (
    <ol aria-label="What it has done" className="flex flex-col gap-2">
      {said.data.map((line) => (
        <li key={line.id} className="flex gap-3 text-sm">
          <time dateTime={line.at} className="shrink-0 tabular-nums text-xs text-text-muted">
            {WHEN.format(new Date(line.at))}
          </time>
          <span className="min-w-0 break-words text-text">{line.message}</span>
        </li>
      ))}
    </ol>
  );
};

RequestHistoryTab.displayName = 'RequestHistoryTab';

export { RequestHistoryTab };
