import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { StatusRing } from '@ValenceUI/StatusRing';
import type { StatusRingStatus } from '@ValenceUI/StatusRing.types';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { toneOfRequestLog } from '@ValenceClient/requests/toneOfRequestLog';
import type { RequestLogTone } from '@ValenceClient/requests/RequestLogTone';
import type { RequestHistoryTabProps } from './RequestHistoryTab.types';
import { say } from '@ValenceI18n/say';

const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const MARKS: Readonly<Record<RequestLogTone, StatusRingStatus>> = {
  quiet: 'pending',
  accent: 'running',
  busy: 'running',
  success: 'done',
  highlight: 'done',
  danger: 'failed',
};

/**
 * The mark beside one line of a request's history: the newest line still running where it is
 * work under way, and an older one that was under way at the time settled to waiting, so only what
 * is happening now turns.
 *
 * @param tone - How the line went.
 * @param isNewest - Whether it is the newest line.
 * @returns The status to draw.
 */
const markOf = (tone: RequestLogTone, isNewest: boolean): StatusRingStatus => {
  const mark = MARKS[tone];

  return mark === 'running' && !isNewest ? 'pending' : mark;
};

/**
 * What a request has done, newest first: every search, how many releases it found and how many
 * were for it, what was chosen or why none would do, which indexers could not answer, and what
 * became of each download, each marked with the round status mark: done, failed, waiting, or
 * turning for whatever is under way now. It is read again every
 * few seconds, so a search can be followed as it goes.
 *
 * @param request - The request.
 */
const RequestHistoryTab = ({ request }: RequestHistoryTabProps) => {
  const said = useQuery(requestsQueries.mediaRequestLog(request.id));

  if (said.isError) {
    return (
      <CouldNotRead
        said={say('common.whatItHasDoneCouldNotBeRead')}
        isTryingAgain={said.isFetching}
        onTryAgain={() => {
          void said.refetch();
        }}
      />
    );
  }

  if (said.data === undefined) {
    return (
      <Spinner
        isCentered
        label={say('screens.requestDetailDialog.requestHistoryTab.readingWhatItHasDone')}
        size="sm"
      />
    );
  }

  if (said.data.length === 0) {
    return <p className="font-body text-sm text-text-muted">{say('common.nothingYet')}</p>;
  }

  return (
    <ol aria-label={say('common.history')} className="flex flex-col">
      {said.data.map((line, at) => (
        <li key={line.id} className="relative flex gap-3 pb-4 text-sm last:pb-0">
          {at === said.data.length - 1 ? null : (
            <span
              aria-hidden
              className="absolute left-[7.5px] top-5 bottom-1 w-px bg-[var(--surface-line)]"
            />
          )}
          <span aria-hidden className="relative mt-0.5 flex shrink-0 rounded-full">
            <StatusRing status={markOf(toneOfRequestLog(line), at === 0)} size={16} />
          </span>
          <span className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="break-words text-text">{sayAgain(line.message)}</span>
              <HowToFix href={docsFor(line.problemCode)} />
            </span>
            <time dateTime={line.at} className="shrink-0 tabular-nums text-xs text-text-muted">
              {WHEN.format(new Date(line.at))}
            </time>
          </span>
        </li>
      ))}
    </ol>
  );
};

RequestHistoryTab.displayName = 'RequestHistoryTab';

export { RequestHistoryTab };
