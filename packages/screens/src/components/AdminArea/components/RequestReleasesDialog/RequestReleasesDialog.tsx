import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { pickMediaRelease } from '@ValenceClient/requests/fetchMediaRequests';
import { ReleasePickTable } from '@ValenceScreens/components/AdminArea/components/ReleasePickTable/ReleasePickTable';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { RequestReleasesDialogProps } from './RequestReleasesDialog.types';

/**
 * Searches for a request by hand: every release the indexers found for it, judged against its
 * profile and in the order they would be chosen, with any one of them to fetch instead.
 *
 * @param request - The request, or nothing while the dialog is closed.
 * @param onClose - Called when it is dismissed.
 * @param onPicked - Told the request once the pick is on its way.
 */
const RequestReleasesDialog = ({ request, onClose, onPicked }: RequestReleasesDialogProps) => {
  const found = useQuery(requestsQueries.mediaRequestReleases(request?.id ?? null));
  const [picking, setPicking] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const requestId = request?.id ?? null;

  const pick = useCallback(
    (release: Release) => {
      if (requestId === null) {
        return;
      }

      setPicking(release.id);
      setProblem(null);

      void pickMediaRelease(requestId, release)
        .then(({ value, refusal }) => {
          if (value === null) {
            setProblem(refusal?.message ?? 'That release could not be fetched.');

            return;
          }

          onPicked(value);
          onClose();
        })
        .finally(() => {
          setPicking(null);
        });
    },
    [requestId, onPicked, onClose],
  );

  const title = request === null ? 'Releases' : `Releases for ${request.title}`;

  return (
    <DialogCompanion label={title} isOpen={request !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail="Every release the indexers found for it, judged against its quality profile, best first."
      />

      <DialogContent>
        {found.isError ? (
          <CouldNotRead
            what="The releases"
            isTryingAgain={found.isFetching}
            onTryAgain={() => {
              void found.refetch();
            }}
          />
        ) : found.data === undefined ? (
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
      </DialogContent>

      <DialogFooter>
        {problem === null ? null : (
          <span role="alert" className="mr-auto text-sm text-danger">
            {problem}
          </span>
        )}

        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

RequestReleasesDialog.displayName = 'RequestReleasesDialog';

export { RequestReleasesDialog };
