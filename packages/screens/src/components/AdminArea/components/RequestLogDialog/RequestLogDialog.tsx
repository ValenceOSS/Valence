import { useQuery } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import type { RequestLogDialogProps } from './RequestLogDialog.types';

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
 * @param request - The request, or nothing while the dialog is closed.
 * @param onClose - Called when it is dismissed.
 */
const RequestLogDialog = ({ request, onClose }: RequestLogDialogProps) => {
  const said = useQuery(requestsQueries.mediaRequestLog(request?.id ?? null));
  const title = request === null ? 'What it has done' : `What ${request.title} has done`;

  return (
    <DialogCompanion label={title} isOpen={request !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail="Every search, what it found, and what became of it, newest first."
      />

      <DialogContent>
        {said.isError ? (
          <CouldNotRead
            what="What it has done"
            isTryingAgain={said.isFetching}
            onTryAgain={() => {
              void said.refetch();
            }}
          />
        ) : said.data === undefined ? (
          <Spinner label="Reading what it has done" size="sm" />
        ) : said.data.length === 0 ? (
          <p className="font-body text-sm text-text-muted">Nothing yet.</p>
        ) : (
          <ol
            aria-label="What it has done"
            className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto"
          >
            {said.data.map((line) => (
              <li key={line.id} className="flex gap-3 text-sm">
                <time dateTime={line.at} className="shrink-0 tabular-nums text-xs text-text-muted">
                  {WHEN.format(new Date(line.at))}
                </time>
                <span className="min-w-0 break-words text-text">{line.message}</span>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

RequestLogDialog.displayName = 'RequestLogDialog';

export { RequestLogDialog };
