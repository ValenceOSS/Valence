import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { pickMediaRelease } from '@ValenceClient/requests/fetchMediaRequests';
import { releaseColumns } from '@ValenceScreens/components/AdminArea/releaseColumns';
import { IndexerReportList } from '@ValenceScreens/components/AdminArea/components/IndexerReportList/IndexerReportList';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { RequestReleasesDialogProps } from './RequestReleasesDialog.types';

/**
 * Searches for a request by hand: every release the indexers found for it, judged against its
 * library's profile and in the order they would be chosen, with any one of them to fetch instead —
 * refused ones included, since whoever picks one knows better than its name does.
 *
 * @param request - The request, or nothing while the dialog is closed.
 * @param onClose - Called when it is dismissed.
 * @param onPicked - Told the request once the pick is on its way.
 */
const RequestReleasesDialog = ({ request, onClose, onPicked }: RequestReleasesDialogProps) => {
  const found = useQuery(requestsQueries.mediaRequestReleases(request?.id ?? null));
  const [picking, setPicking] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const judged = useMemo(
    () => new Map((found.data?.judgements ?? []).map((one) => [one.releaseId, one])),
    [found.data],
  );
  const pickedId = found.data?.pickedId ?? null;
  const now = found.dataUpdatedAt;
  const requestId = request?.id ?? null;

  const columns = useMemo<DataTableColumn<Release>[]>(
    () => [
      ...releaseColumns({ judged, pickedId, now }),
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <Button
              variant="secondary"
              size="xs"
              disabled={picking !== null || requestId === null}
              isLoading={picking === row.original.id}
              onClick={() => {
                if (requestId === null) {
                  return;
                }

                setPicking(row.original.id);
                setProblem(null);

                void pickMediaRelease(requestId, row.original)
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
              }}
            >
              Fetch this
            </Button>
          </span>
        ),
      },
    ],
    [judged, pickedId, now, picking, requestId, onPicked, onClose],
  );

  const title = request === null ? 'Releases' : `Releases for ${request.title}`;

  return (
    <DialogCompanion label={title} isOpen={request !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail="Every release the indexers found for it, judged against its library’s profile, best first."
      />

      <DialogContent className="flex flex-col gap-3">
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
          <>
            <IndexerReportList reports={found.data.indexers} />

            <DataTable
              label="Releases found"
              columns={columns}
              rows={found.data.releases}
              getRowId={(release) => release.id}
              emptyMessage="Nothing the indexers have is for this request."
            />
          </>
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
