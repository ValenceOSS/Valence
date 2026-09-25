import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontal as MoreHorizontalIcon,
  Plug as PlugIcon,
  Plus as PlusIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Pen as PenFilledIcon,
  Plug as PlugFilledIcon,
} from '@keyline-icons/react/fill';
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
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const KIND_LABELS: Readonly<Partial<Record<string, StringKey>>> = {
  torznab: 'admin.indexersPanel.torznab',
  newznab: 'admin.indexersPanel.newznab',
  cardigann: 'admin.indexersPanel.site',
  public: 'admin.indexersPanel.publicSite',
  'semi-private': 'admin.indexersPanel.semiPrivateSite',
  private: 'admin.indexersPanel.privateSite',
};

const TESTED_AT_ONCE = 4;

/**
 * Names the kind of an indexer, or its privacy where it is a site from the catalogue.
 *
 * @param kind - The indexer's privacy, or its kind where it has none.
 * @returns What to call it, or nothing for a kind added since.
 */
const kindLabel = (kind: string): string | null => {
  const key = KIND_LABELS[kind];

  return key === undefined ? null : say(key);
};

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
          tellOutcome(say('admin.indexersPanel.answered', { name: indexer.name }), failure);
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
            indexer.isEnabled
              ? say('admin.indexersPanel.turnedOff', { name: indexer.name })
              : say('admin.indexersPanel.turnedOn', { name: indexer.name }),
            failureOfRefusal(refusal),
          );
          setProblem(refusal?.message ?? null);
        })
        .then(reread);
    };

    return [
      {
        id: 'name',
        header: say('admin.indexersPanel.indexer'),
        accessorFn: (indexer) => indexer.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <Badge size="sm">{kindLabel(row.original.privacy ?? row.original.kind)}</Badge>
            </span>

            <span className="truncate text-xs text-text-muted">{row.original.url}</span>
          </span>
        ),
      },
      {
        id: 'priority',
        header: say('admin.indexersPanel.priority'),
        accessorFn: (indexer) => indexer.priority,
        cell: ({ row }) => <span className="text-sm text-text">{row.original.priority}</span>,
      },
      {
        id: 'searches',
        header: say('admin.indexersPanel.searches'),
        accessorFn: describeIndexerSearches,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">{describeIndexerSearches(row.original)}</span>
        ),
      },
      {
        id: 'state',
        header: say('admin.indexersPanel.state'),
        accessorFn: (indexer) => describeIndexerState(indexer).label,
        cell: ({ row }) => {
          const state = describeIndexerState(row.original);

          return testing.has(row.original.id) ? (
            <Spinner
              size="sm"
              label={say('admin.indexersPanel.testing', { name: row.original.name })}
            />
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
              label={say('admin.indexersPanel.actionsFor', { name: row.original.name })}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'edit',
                      label: say('admin.indexersPanel.change'),
                      icon: <Icon of={PenFilledIcon} size={15} />,
                      onChoose: () => {
                        setEditing(row.original);
                      },
                    },
                    {
                      id: 'test',
                      label: say('admin.indexersPanel.test'),
                      detail: say('admin.indexersPanel.testDetail'),
                      icon: <Icon of={PlugFilledIcon} size={15} />,
                      isDisabled: testing.size > 0 || isTestingAll,
                      onChoose: () => {
                        test(row.original);
                      },
                    },
                    {
                      id: 'switch',
                      label: row.original.isEnabled
                        ? say('admin.indexersPanel.switchOff')
                        : say('admin.indexersPanel.switchOn'),
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
                      label: say('admin.indexersPanel.remove'),
                      icon: <Icon of={BinFilledIcon} size={15} />,
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
      title={say('admin.indexersPanel.title')}
      isFlush
      actions={
        <>
          <PanelCardAction
            icon={PlugIcon}
            isLoading={isTestingAll}
            isDisabled={toTest.length === 0 || testing.size > 0}
            onClick={testAll}
          >
            {say('admin.indexersPanel.testAll')}
          </PanelCardAction>

          <PanelCardAction
            icon={PlusIcon}
            onClick={() => {
              setIsChoosing(true);
            }}
          >
            {say('admin.indexersPanel.add')}
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
        title={
          removing === null
            ? say('admin.indexersPanel.removeThis')
            : say('admin.indexersPanel.removeTitle', { name: removing.name })
        }
        detail={say('admin.indexersPanel.removeDetail')}
        confirmLabel={say('admin.indexersPanel.remove')}
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
                tellOutcome(
                  say('admin.indexersPanel.removed', { name: gone.name }),
                  failureOfRefusal(refusal),
                );
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
          what={say('admin.indexersPanel.theIndexers')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner isCentered label={say('admin.indexersPanel.reading')} size="sm" />
      ) : (
        <DataTable
          label={say('admin.indexersPanel.title')}
          columns={columns}
          rows={asked.data}
          getRowId={(indexer) => indexer.id}
          emptyMessage={say('admin.indexersPanel.empty')}
        />
      )}
    </PanelCard>
  );
};

IndexersPanel.displayName = 'IndexersPanel';

export { IndexersPanel };
