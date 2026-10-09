import { useMemo } from 'react';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { releaseColumns } from '@ValenceScreens/components/AdminArea/releaseColumns';
import { IndexerReportList } from '@ValenceScreens/components/AdminArea/components/IndexerReportList/IndexerReportList';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { ReleasePickTableProps } from './ReleasePickTable.types';
import { say } from '@ValenceI18n/say';

/**
 * The releases found for something asked for, judged and best first, with what each indexer said,
 * and any one of them to fetch — refused ones included, since whoever picks one knows better than
 * its name does.
 *
 * @param found - What the indexers found, judged.
 * @param foundAt - When it was found, which ages are told from.
 * @param pickingId - The release being fetched, while it is.
 * @param emptyMessage - What to say where nothing was found.
 * @param kind - What the releases are for, which decides the quality or format column.
 * @param isHereAlready - Whether a film is in the library already, when each release is offered
 *   in place of the copy there or beside it as a second version.
 * @param onPick - Told the release picked.
 */
const ReleasePickTable = ({
  found,
  foundAt,
  pickingId,
  emptyMessage,
  kind,
  isHereAlready = false,
  onPick,
}: ReleasePickTableProps) => {
  const columns = useMemo<DataTableColumn<Release>[]>(
    () => [
      ...releaseColumns({
        judged: new Map(found.judgements.map((one) => [one.releaseId, one])),
        pickedId: found.pickedId,
        now: foundAt,
        ...(kind === undefined ? {} : { kind }),
      }),
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end gap-2">
            {isHereAlready ? (
              <Button
                variant="secondary"
                size="xs"
                disabled={pickingId !== null}
                onClick={() => {
                  onPick(row.original, true);
                }}
              >
                {say('screens.adminArea.releasePickTable.downloadBoth')}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="xs"
              disabled={pickingId !== null}
              isLoading={pickingId === row.original.id}
              onClick={() => {
                onPick(row.original, false);
              }}
            >
              {isHereAlready
                ? say('screens.adminArea.releasePickTable.replaceIt')
                : say('common.download')}
            </Button>
          </span>
        ),
      },
    ],
    [found, foundAt, pickingId, onPick, kind, isHereAlready],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <IndexerReportList reports={found.indexers} />

      <DataTable
        label={say('common.releasesFound')}
        columns={columns}
        rows={found.releases}
        height="parent"
        className="min-h-0 flex-1"
        getRowId={(release) => release.id}
        emptyMessage={emptyMessage}
      />
    </div>
  );
};

ReleasePickTable.displayName = 'ReleasePickTable';

export { ReleasePickTable };
