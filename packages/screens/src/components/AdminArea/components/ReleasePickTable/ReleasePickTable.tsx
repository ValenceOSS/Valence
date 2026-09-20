import { useMemo } from 'react';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { releaseColumns } from '@ValenceScreens/components/AdminArea/releaseColumns';
import { IndexerReportList } from '@ValenceScreens/components/AdminArea/components/IndexerReportList/IndexerReportList';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { ReleasePickTableProps } from './ReleasePickTable.types';

/**
 * The releases found for something asked for, judged and best first, with what each indexer said,
 * and any one of them to fetch — refused ones included, since whoever picks one knows better than
 * its name does.
 *
 * @param found - What the indexers found, judged.
 * @param foundAt - When it was found, which ages are told from.
 * @param pickingId - The release being fetched, while it is.
 * @param emptyMessage - What to say where nothing was found.
 * @param onPick - Told the release picked.
 */
const ReleasePickTable = ({
  found,
  foundAt,
  pickingId,
  emptyMessage,
  onPick,
}: ReleasePickTableProps) => {
  const columns = useMemo<DataTableColumn<Release>[]>(
    () => [
      ...releaseColumns({
        judged: new Map(found.judgements.map((one) => [one.releaseId, one])),
        pickedId: found.pickedId,
        now: foundAt,
      }),
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <Button
              variant="secondary"
              size="xs"
              disabled={pickingId !== null}
              isLoading={pickingId === row.original.id}
              onClick={() => {
                onPick(row.original);
              }}
            >
              Fetch this
            </Button>
          </span>
        ),
      },
    ],
    [found, foundAt, pickingId, onPick],
  );

  return (
    <div className="flex flex-col gap-3">
      <IndexerReportList reports={found.indexers} />

      <DataTable
        label="Releases found"
        columns={columns}
        rows={found.releases}
        getRowId={(release) => release.id}
        emptyMessage={emptyMessage}
      />
    </div>
  );
};

ReleasePickTable.displayName = 'ReleasePickTable';

export { ReleasePickTable };
