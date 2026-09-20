import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  PlugSocketIcon,
  ToggleOffIcon,
  ToggleOnIcon,
} from '@hugeicons/core-free-icons';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { changeIndexer, removeIndexer, testIndexer } from '@ValenceClient/requests/fetchIndexers';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { IndexerDialog } from '@ValenceScreens/components/AdminArea/components/IndexerDialog/IndexerDialog';
import { IndexerCatalogueDialog } from '@ValenceScreens/components/AdminArea/components/IndexerCatalogueDialog/IndexerCatalogueDialog';
import type { IndexerStart } from '@ValenceScreens/components/AdminArea/IndexerStart';
import { describeIndexerSearches } from './describeIndexerSearches';
import { describeIndexerState } from './describeIndexerState';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

const KIND_LABELS: Readonly<Record<string, string>> = {
  torznab: 'Torznab',
  newznab: 'Newznab',
  cardigann: 'Site',
  public: 'Public site',
  'semi-private': 'Semi-private site',
  private: 'Private site',
};

/**
 * Every indexer requesting searches: how each is doing, what it can be searched for, and the
 * things that can be done to it — changing it, testing it, switching it on or off, and removing it.
 *
 * Whatever the server said went wrong is shown above the table rather than swallowed, and the list
 * is read again after anything is done so what it shows is what the service now holds.
 */
const IndexersPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(requestsQueries.indexers());
  const [editing, setEditing] = useState<Indexer | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [start, setStart] = useState<IndexerStart | null>(null);
  const [removing, setRemoving] = useState<Indexer | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const reread = useCallback(
    () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: requestsQueries.indexers().queryKey }),
        cache.invalidateQueries({ queryKey: requestsQueries.overview().queryKey }),
      ]),
    [cache],
  );

  const columns = useMemo<DataTableColumn<Indexer>[]>(() => {
    const test = (indexer: Indexer) => {
      setTestingId(indexer.id);
      setProblem(null);

      void testIndexer(indexer.id)
        .then(({ value, refusal }) => {
          setProblem(
            refusal?.message ??
              (value?.isWorking === false
                ? `${indexer.name}: ${value.problem ?? 'did not answer'}`
                : null),
          );
        })
        .then(reread)
        .finally(() => {
          setTestingId(null);
        });
    };

    const switchOnOrOff = (indexer: Indexer) => {
      setProblem(null);

      void changeIndexer(indexer.id, { isEnabled: !indexer.isEnabled })
        .then(({ refusal }) => {
          setProblem(refusal?.message ?? null);
        })
        .then(reread);
    };

    return [
      {
        id: 'name',
        header: 'Indexer',
        accessorFn: (indexer) => indexer.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <Badge size="sm">{KIND_LABELS[row.original.privacy ?? row.original.kind]}</Badge>
            </span>

            <span className="truncate text-xs text-text-muted">{row.original.url}</span>
          </span>
        ),
      },
      {
        id: 'priority',
        header: 'Priority',
        accessorFn: (indexer) => indexer.priority,
        cell: ({ row }) => <span className="text-sm text-text">{row.original.priority}</span>,
      },
      {
        id: 'searches',
        header: 'Searches',
        accessorFn: describeIndexerSearches,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">{describeIndexerSearches(row.original)}</span>
        ),
      },
      {
        id: 'state',
        header: 'State',
        accessorFn: (indexer) => describeIndexerState(indexer).label,
        cell: ({ row }) => {
          const state = describeIndexerState(row.original);

          return testingId === row.original.id ? (
            <Spinner size="sm" label={`Testing ${row.original.name}`} />
          ) : (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge size="sm" tone={state.tone}>
                {state.label}
              </Badge>

              {state.detail === null ? null : (
                <span className="text-xs text-text-muted">{state.detail}</span>
              )}
            </span>
          );
        },
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={`Actions for ${row.original.name}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'edit',
                      label: 'Change',
                      icon: <Icon of={PencilEdit02Icon} size={15} />,
                      onChoose: () => {
                        setEditing(row.original);
                      },
                    },
                    {
                      id: 'test',
                      label: 'Test',
                      detail: 'Asks it what it can search, and clears its failures if it answers.',
                      icon: <Icon of={PlugSocketIcon} size={15} />,
                      isDisabled: testingId !== null,
                      onChoose: () => {
                        test(row.original);
                      },
                    },
                    {
                      id: 'switch',
                      label: row.original.isEnabled ? 'Switch off' : 'Switch on',
                      icon: (
                        <Icon
                          of={row.original.isEnabled ? ToggleOffIcon : ToggleOnIcon}
                          size={15}
                        />
                      ),
                      onChoose: () => {
                        switchOnOrOff(row.original);
                      },
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'remove',
                      label: 'Remove',
                      icon: <Icon of={Delete02Icon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        setRemoving(row.original);
                      },
                    },
                  ],
                },
              ]}
            />
          </span>
        ),
      },
    ];
  }, [reread, testingId]);

  return (
    <PanelCard
      title="Indexers"
      isFlush
      actions={
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setIsChoosing(true);
          }}
        >
          Add an indexer
        </Button>
      }
    >
      <IndexerCatalogueDialog
        isOpen={isChoosing}
        onClose={() => {
          setIsChoosing(false);
        }}
        onChoose={(chosen) => {
          setIsChoosing(false);
          setStart(chosen);
        }}
      />

      <IndexerDialog
        isOpen={start !== null || editing !== null}
        indexer={editing}
        start={start}
        onClose={() => {
          setStart(null);
          setEditing(null);
        }}
        {...(start === null
          ? {}
          : {
              onBack: () => {
                setStart(null);
                setIsChoosing(true);
              },
            })}
        onSaved={() => {
          void reread();
        }}
      />

      <ConfirmDialog
        title={`Remove ${removing?.name ?? 'this indexer'}?`}
        detail="It will not be searched again, and its key is forgotten. Adding it back means typing the key again."
        confirmLabel="Remove"
        isDestructive
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          const gone = removing;

          setRemoving(null);

          if (gone !== null) {
            void removeIndexer(gone.id)
              .then((refusal) => {
                setProblem(refusal?.message ?? null);
              })
              .then(reread);
          }
        }}
      />

      {problem === null ? null : (
        <p role="alert" className="px-4 pt-3 text-sm text-danger">
          {problem}
        </p>
      )}

      {asked.isError ? (
        <CouldNotRead
          what="The indexers"
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <div className="p-4">
          <Spinner label="Reading the indexers" size="sm" />
        </div>
      ) : (
        <DataTable
          label="Indexers"
          columns={columns}
          rows={asked.data}
          getRowId={(indexer) => indexer.id}
          emptyMessage="No indexers yet. Add a site from the catalogue, or any Torznab or Newznab indexer, to have something to search."
        />
      )}
    </PanelCard>
  );
};

IndexersPanel.displayName = 'IndexersPanel';

export { IndexersPanel };
