import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { liftRequestBlock } from '@ValenceClient/requests/fetchMediaRequests';
import type { RequestBlocklistTabProps } from './RequestBlocklistTab.types';

const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * The releases this request will not try again, and why each was given up on — a download that
 * failed, or that sat still for hours. Letting one back lets the next search pick it up again,
 * which is what to do when the release was fine and the download client was not.
 *
 * @param request - The request.
 * @param onLifted - Told when a release may be tried again, so whatever is showing it reads again.
 */
const RequestBlocklistTab = ({ request, onLifted }: RequestBlocklistTabProps) => {
  const cache = useQueryClient();
  const blocked = useQuery(requestsQueries.requestBlocklist(request.id));
  const [lifting, setLifting] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  if (blocked.isError) {
    return (
      <CouldNotRead
        what="What it will not try again"
        isTryingAgain={blocked.isFetching}
        onTryAgain={() => {
          void blocked.refetch();
        }}
      />
    );
  }

  if (blocked.data === undefined) {
    return <Spinner isCentered label="Reading what it will not try again" size="sm" />;
  }

  if (blocked.data.length === 0) {
    return (
      <p className="font-body text-sm text-text-muted">
        It has given up on nothing. A download that fails, or stalls for hours, lands here and is
        not tried again for this request.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      <ul aria-label="What it will not try again" className="flex flex-col gap-2">
        {blocked.data.map((block) => (
          <li
            key={block.id}
            className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-2 last:border-b-0"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="min-w-0 break-all text-sm text-text">{block.title}</span>
              <span className="text-xs text-text-muted">
                {block.reason} · {WHEN.format(new Date(block.at))}
              </span>
            </span>

            <Button
              variant="ghost"
              size="xs"
              isLoading={lifting === block.id}
              onClick={() => {
                setLifting(block.id);
                setProblem(null);

                void liftRequestBlock(request.id, block.id)
                  .then((refusal) => {
                    if (refusal !== null) {
                      setProblem(refusal.message);

                      return;
                    }

                    onLifted();

                    return cache.invalidateQueries({
                      queryKey: requestsQueries.requestBlocklist(request.id).queryKey,
                    });
                  })
                  .finally(() => {
                    setLifting(null);
                  });
              }}
            >
              Try it again
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

RequestBlocklistTab.displayName = 'RequestBlocklistTab';

export { RequestBlocklistTab };
