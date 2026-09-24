import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye as EyeIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { useShell } from '@ValenceClient/shell/useShell';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { ConfirmHiding } from '@ValenceScreens/components/ConfirmHiding/ConfirmHiding';
import { useHidden } from '@ValenceClient/library/useHidden';
import { librariesToHide } from '@ValenceClient/library/librariesToHide';
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
 * A whole library is hidden from here rather than from a page, because a viewer never meets one:
 * they browse sections, and a library is an operator's idea of how the disk is arranged. So the only
 * honest place to offer it is beside the list it is undone from.
 *
 * Belongs to the face rather than the account, so somebody switching profiles sees their own.
 */
const HiddenPanel = () => {
  const { watcher } = useShell();
  const profileId = watcher?.id ?? null;
  const asked = useQuery(viewingQueries.hidden(profileId));
  const hiding = useHidden(profileId);
  const shelves = librariesToHide(useQuery(libraryQueries.all()).data ?? [], hiding.entries);

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
              <Icon of={EyeIcon} size={16} />
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
        Things you have taken out of your own browsing. Anything here can be brought back.
      </p>

      <div className="flex flex-col gap-2 px-4 pt-4">
        <p className="text-sm font-medium text-text">Whole libraries</p>

        <p className="text-xs text-text-muted">
          The quickest of the three. Somebody who never watches television hides one thing here and
          their home page becomes theirs.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {shelves.length === 0 ? (
            <p className="text-sm text-text-muted">There are no libraries yet.</p>
          ) : (
            shelves.map((shelf) => {
              const isHidden = hiding.isHidden({ kind: 'library', subjectId: shelf.id });

              return (
                <Button
                  key={shelf.id}
                  variant={isHidden ? 'ghost' : 'glossy'}
                  size="sm"
                  aria-pressed={isHidden}
                  label={
                    isHidden
                      ? `Bring the ${shelf.name} library back`
                      : `Hide the whole ${shelf.name} library`
                  }
                  onClick={() => {
                    if (isHidden) {
                      hiding.show({ kind: 'library', subjectId: shelf.id });

                      return;
                    }

                    hiding.askLibrary(shelf.id, shelf.name);
                  }}
                >
                  {shelf.name}
                </Button>
              );
            })
          )}
        </div>
      </div>

      <ConfirmHiding hiding={hiding} />

      {asked.isError ? (
        <CouldNotRead
          what="What you have hidden"
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner isCentered label="Reading what you have hidden" size="sm" />
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
