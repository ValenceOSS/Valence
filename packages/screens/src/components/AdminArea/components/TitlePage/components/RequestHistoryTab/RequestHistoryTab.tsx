import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
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

const DOTS: Readonly<Record<RequestLogTone, string>> = {
  quiet: 'bg-text-muted/50',
  accent: 'bg-accent',
  busy: 'bg-busy',
  success: 'bg-success',
  highlight: 'bg-highlight',
  danger: 'bg-danger',
};

/**
 * What a request has done, newest first: every search, how many releases it found and how many
 * were for it, what was chosen or why none would do, which indexers could not answer, and what
 * became of each download, as a line of coloured dots saying how each went. It is read again every
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
              className="absolute left-[4.5px] top-3 h-full w-px bg-[var(--surface-line)]"
            />
          )}
          <span
            aria-hidden
            className={cn(
              'relative mt-1.5 size-2.5 shrink-0 rounded-full',
              DOTS[toneOfRequestLog(line)],
            )}
          />
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
