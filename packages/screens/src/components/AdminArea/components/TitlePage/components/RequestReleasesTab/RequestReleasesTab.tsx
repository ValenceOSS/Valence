import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { notify } from '@ValenceUI/notify';
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { pickMediaRelease } from '@ValenceClient/requests/fetchMediaRequests';
import { ReleasePickTable } from '@ValenceScreens/components/AdminArea/components/ReleasePickTable/ReleasePickTable';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { RequestReleasesTabProps } from './RequestReleasesTab.types';
import { say } from '@ValenceI18n/say';

/**
 * Every release the indexers have for a request, judged against its quality profile and in the
 * order they would be chosen — which says both what was taken and why the rest were not — with any
 * one of them to fetch instead, or, for a film already here, to keep beside it as a second
 * version.
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
    (release: Release, keepsBoth: boolean) => {
      setPicking(release.id);
      setProblem(null);

      void pickMediaRelease(id, release, keepsBoth)
        .then(({ value, refusal }) => {
          if (value === null) {
            setProblem(
              refusal?.message ??
                say('screens.requestDetailDialog.requestReleasesTab.thatReleaseCouldNotBeFetched'),
            );

            return;
          }

          notify.worked(say('screens.requestDetailDialog.requestReleasesTab.fetchingThatRelease'));
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
        said={say('screens.requestDetailDialog.requestReleasesTab.theReleasesCouldNotBeRead')}
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
        <Spinner isCentered label={say('common.askingEveryIndexer')} size="sm" />
      ) : (
        <ReleasePickTable
          isHereAlready={
            request.kind === 'film' &&
            request.items.some((item) => item.state === 'filed' || item.state === 'available')
          }
          kind={
            isMusicRequest(request.kind) ? 'music' : isBookRequest(request.kind) ? 'book' : 'video'
          }
          found={found.data}
          foundAt={found.dataUpdatedAt}
          pickingId={picking}
          emptyMessage={say(
            'screens.requestDetailDialog.requestReleasesTab.nothingTheIndexersHaveIsFor',
          )}
          onPick={pick}
        />
      )}
    </div>
  );
};

RequestReleasesTab.displayName = 'RequestReleasesTab';

export { RequestReleasesTab };
