import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { notify } from '@ValenceUI/notify';
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { pickMediaRelease } from '@ValenceClient/requests/fetchMediaRequests';
import { ReleasePickTable } from '@ValenceScreens/components/AdminArea/components/ReleasePickTable/ReleasePickTable';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { RequestReleasesTabProps } from './RequestReleasesTab.types';
import { leaveOutTheUnnamed } from './leaveOutTheUnnamed';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Every release the indexers have for a request, judged against its quality profile and in the
 * order they would be chosen — which says both what was taken and why the rest were not — with any
 * one of them to fetch instead, or, for a film already here, to keep beside it as a second
 * version. Releases whose names are some other title are left out until asked for, since a loose
 * search can bring back far more of them than of this one. The search can be narrowed to some of
 * the indexers it was made on, and searched again on just those.
 *
 * @param request - The request.
 * @param scope - The season or episode the search is narrowed to, or nothing for all of it.
 * @param onPicked - Told the request once the pick is on its way.
 */
const RequestReleasesTab = ({ request, scope = null, onPicked }: RequestReleasesTabProps) => {
  const [chosenIndexers, setChosenIndexers] = useState<string[] | null>(null);
  const everywhere = useQuery(requestsQueries.mediaRequestReleases(request.id, scope));
  const found = useQuery(requestsQueries.mediaRequestReleases(request.id, scope, chosenIndexers));
  const offered = (everywhere.data?.indexers ?? []).map((report) => ({
    id: report.indexerId,
    label: report.indexerName,
  }));
  const [picking, setPicking] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [showsTheUnnamed, setShowsTheUnnamed] = useState(false);
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

  const sorted = found.data === undefined ? null : leaveOutTheUnnamed(found.data);

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

      {offered.length < 2 && (sorted === null || sorted.leftOut === 0) ? null : (
        <div className="flex items-center justify-between gap-3">
          {offered.length < 2 ? (
            <span />
          ) : (
            <FilterMenu
              label={say('common.indexers')}
              hasLabel
              groups={[{ name: say('common.indexers'), options: offered }]}
              selected={new Set(chosenIndexers ?? offered.map((option) => option.id))}
              onChange={(next) => {
                setChosenIndexers(next.size === offered.length ? null : [...next]);
              }}
            />
          )}

          {sorted === null || sorted.leftOut === 0 ? null : (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setShowsTheUnnamed((was) => !was);
              }}
            >
              {showsTheUnnamed
                ? say('screens.requestDetailDialog.requestReleasesTab.hideTheUnnamed')
                : sayCount(
                    'screens.requestDetailDialog.requestReleasesTab.showTheUnnamed',
                    sorted.leftOut,
                  )}
            </Button>
          )}
        </div>
      )}

      {found.data === undefined || sorted === null ? (
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
          narrations={request.narrations ?? []}
          found={showsTheUnnamed ? found.data : sorted.found}
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
