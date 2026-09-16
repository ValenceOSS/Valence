import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ViewIcon } from '@hugeicons/core-free-icons';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { useShell } from '@ValenceClient/shell/useShell';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { useHidden } from '@ValenceClient/library/useHidden';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Hidden } from '@ValenceContracts/schemas/Hidden';

const WHAT_IT_IS: Record<Hidden['kind'], string | null> = {
  item: null,
  series: 'Programme',
  library: 'Whole library',
};

/**
 * What this viewer has hidden from themselves, and the way back.
 *
 * The list is the reason hiding is safe to offer at all. Something taken out of every row, every
 * search and the randomiser is otherwise gone with no way of remembering it existed, and a viewer
 * who hides a programme by accident has no way to undo it.
 *
 * Belongs to the face rather than the account, so somebody switching profiles sees their own.
 */
const HiddenPanel = () => {
  const { watcher } = useShell();
  const profileId = watcher?.id ?? null;
  const asked = useQuery(viewingQueries.hidden(profileId));
  const hiding = useHidden(profileId);

  const columns = useMemo<DataTableColumn<Hidden>[]>(
    () => [
      {
        id: 'title',
        header: 'Hidden',
        accessorFn: (entry) => entry.title,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.title}</span>

              {WHAT_IT_IS[row.original.kind] === null ? null : (
                <Badge size="sm">{WHAT_IT_IS[row.original.kind]}</Badge>
              )}
            </span>

            <span className="truncate text-xs text-text-muted">
              Hidden {saidWhen(row.original.hiddenAt)}
            </span>
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              label={`Bring ${row.original.title} back`}
              onClick={() => {
                hiding.show({ kind: row.original.kind, subjectId: row.original.subjectId });
              }}
            >
              <Icon of={ViewIcon} size={16} />
            </Button>
          </span>
        ),
      },
    ],
    [hiding],
  );

  return (
    <PanelCard title="Hidden" isFlush>
      <p className="px-4 pt-4 text-sm text-text-muted">
        Things you have taken out of your own browsing. Nobody else on this account is affected, and
        anything here can be brought back.
      </p>

      {asked.isError ? (
        <CouldNotRead
          what="What you have hidden"
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <div className="p-4">
          <Spinner label="Reading what you have hidden" size="sm" />
        </div>
      ) : (
        <DataTable
          label="Things you have hidden"
          columns={columns}
          rows={hiding.entries}
          emptyMessage="You have not hidden anything. Hiding something from its page puts it here."
        />
      )}
    </PanelCard>
  );
};

HiddenPanel.displayName = 'HiddenPanel';

export { HiddenPanel };
