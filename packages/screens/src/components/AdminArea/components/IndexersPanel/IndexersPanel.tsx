import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pen as PenIcon,
  Plug as PlugIcon,
  Plus as PlusIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@keyline-icons/react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { changeIndexer, removeIndexer } from '@ValenceClient/requests/fetchIndexers';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { IndexerDialog } from '@ValenceScreens/components/AdminArea/components/IndexerDialog/IndexerDialog';
import { IndexerCatalogueDialog } from '@ValenceScreens/components/AdminArea/components/IndexerCatalogueDialog/IndexerCatalogueDialog';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import type { IndexerStart } from '@ValenceScreens/components/AdminArea/IndexerStart';
import { describeIndexerSearches } from './describeIndexerSearches';
import { describeIndexerState } from './describeIndexerState';
import { describeTestRound } from './describeTestRound';
import { testAndSayWhy } from './testAndSayWhy';
import { whichToTest } from './whichToTest';
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

const TESTED_AT_ONCE = 4;

const NONE_TESTING: ReadonlySet<string> = new Set();

/**
 * Every indexer requesting searches: how each is doing, what it can be searched for, and the
 * things that can be done to it — changing it, testing it, switching it on or off, and removing it.
 * Testing them all asks every one that is on, or that Valence turned off, a few at a time.
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
  const [testing, setTesting] = useState<ReadonlySet<string>>(NONE_TESTING);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const reread = useCallback(
    () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: requestsQueries.indexers().queryKey }),
        cache.invalidateQueries({ queryKey: requestsQueries.overview().queryKey }),
      ]),
    [cache],
  );

  const toTest = whichToTest(asked.data ?? []);

  const testAll = () => {
    setIsTestingAll(true);
    setProblem(null);

    void mapWithLimit(toTest, TESTED_AT_ONCE, async (indexer) => {
      setTesting((before) => new Set([...before, indexer.id]));

      const failure = await testAndSayWhy(indexer);

      setTesting((before) => new Set([...before].filter((one) => one !== indexer.id)));

      return { name: indexer.name, failure };
    })
      .then((outcomes) => {
        const { done, failure } = describeTestRound(outcomes);

        tellOutcome(done, failure);
        setProblem(failure);
      })
      .then(reread)
      .finally(() => {
        setTesting(NONE_TESTING);
        setIsTestingAll(false);
      });
  };

  const columns = useMemo<DataTableColumn<Indexer>[]>(() => {
    const test = (indexer: Indexer) => {
      setTesting(new Set([indexer.id]));
      setProblem(null);

      void testAndSayWhy(indexer)
        .then((failure) => {
          tellOutcome(`${indexer.name} answered.`, failure);
          setProblem(failure);
        })
        .then(reread)
        .finally(() => {
          setTesting(NONE_TESTING);
        });
    };

    const switchOnOrOff = (indexer: Indexer) => {
      setProblem(null);

      void changeIndexer(indexer.id, { isEnabled: !indexer.isEnabled })
        .then(({ refusal }) => {
          tellOutcome(
            indexer.isEnabled ? `Turned off ${indexer.name}.` : `Turned on ${indexer.name}.`,
            failureOfRefusal(refusal),
          );
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

          return testing.has(row.original.id) ? (
            <Spinner size="sm" label={`Testing ${row.original.name}`} />
          ) : (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge size="sm" tone={state.tone}>
                {state.label}
              </Badge>

              {state.detail === null ? null : (
                <span className="text-xs text-text-muted">{state.detail}</span>
              )}

              <HowToFix href={state.help} />
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
                      icon: <Icon of={PenIcon} size={15} />,
                      onChoose: () => {
                        setEditing(row.original);
                      },
                    },
                    {
                      id: 'test',
                      label: 'Test',
                      detail: 'Asks it what it can search, and clears its failures if it answers.',
                      icon: <Icon of={PlugIcon} size={15} />,
                      isDisabled: testing.size > 0 || isTestingAll,
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
                      icon: <Icon of={BinIcon} size={15} />,
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
  }, [isTestingAll, reread, testing]);

  return (
    <PanelCard
      title="Indexers"
      isFlush
      actions={
        <>
          <PanelCardAction
            icon={PlugIcon}
            isLoading={isTestingAll}
            isDisabled={toTest.length === 0 || testing.size > 0}
            onClick={testAll}
          >
            Test all
          </PanelCardAction>

          <PanelCardAction
            icon={PlusIcon}
            onClick={() => {
              setIsChoosing(true);
            }}
          >
            Add an indexer
          </PanelCardAction>
        </>
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
                tellOutcome(`Removed ${gone.name}.`, failureOfRefusal(refusal));
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
        <Spinner isCentered label="Reading the indexers" size="sm" />
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
