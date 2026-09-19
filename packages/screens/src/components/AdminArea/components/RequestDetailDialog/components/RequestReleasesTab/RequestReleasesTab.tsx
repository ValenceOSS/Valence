import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { pickMediaRelease } from '@ValenceClient/requests/fetchMediaRequests';
import { ReleasePickTable } from '@ValenceScreens/components/AdminArea/components/ReleasePickTable/ReleasePickTable';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { RequestReleasesTabProps } from './RequestReleasesTab.types';

/**
 * Every release the indexers have for a request, judged against its quality profile and in the
 * order they would be chosen — which says both what was taken and why the rest were not — with any
 * one of them to fetch instead.
 *
 * @param request - The request.
 * @param onPicked - Told the request once the pick is on its way.
 */
const RequestReleasesTab = ({ request, onPicked }: RequestReleasesTabProps) => {
  const found = useQuery(requestsQueries.mediaRequestReleases(request.id));
  const [picking, setPicking] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const { id } = request;

  const pick = useCallback(
    (release: Release) => {
      setPicking(release.id);
      setProblem(null);

      void pickMediaRelease(id, release)
        .then(({ value, refusal }) => {
          if (value === null) {
            setProblem(refusal?.message ?? 'That release could not be fetched.');

            return;
          }

          onPicked(value);
        })
        .finally(() => {
          setPicking(null);
        });
    },
    [id, onPicked],
  );

  if (found.isError) {
    return (
      <CouldNotRead
        what="The releases"
        isTryingAgain={found.isFetching}
        onTryAgain={() => {
          void found.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      {found.data === undefined ? (
        <Spinner label="Asking every indexer" size="sm" />
      ) : (
        <ReleasePickTable
          found={found.data}
          foundAt={found.dataUpdatedAt}
          pickingId={picking}
          emptyMessage="Nothing the indexers have is for this request."
          onPick={pick}
        />
      )}
    </div>
  );
};

RequestReleasesTab.displayName = 'RequestReleasesTab';

export { RequestReleasesTab };
