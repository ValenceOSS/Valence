import { INDEXER_PRIVACY_LOOKS } from '@ValenceScreens/admin/INDEXER_PRIVACY_LOOKS';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinFilledIcon,
  Download as DownloadFilledIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pen as PenFilledIcon,
  Plug as PlugFilledIcon,
  Plus as PlusFilledIcon,
  SearchList as SearchListFilledIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ReleaseSearchDialog } from '@ValenceScreens/components/AdminArea/components/ReleaseSearchDialog/ReleaseSearchDialog';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { isEveryLibraryHandedOff } from '@ValenceClient/requests/isEveryLibraryHandedOff';
import { changeIndexer, removeIndexer } from '@ValenceClient/requests/fetchIndexers';
import { importArrIndexers } from '@ValenceClient/requests/fetchArrApps';
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
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { say } from '@ValenceI18n/say';

const KIND_LABELS: Readonly<Record<string, string>> = {
  torznab: say('common.torznab'),
  newznab: say('common.newznab'),
  cardigann: say('common.site'),
};

const TESTED_AT_ONCE = 4;

const NONE_TESTING: ReadonlySet<string> = new Set();

/**
 * Every indexer requesting searches: how each is doing, what it can be searched for, and the
 * things that can be done to it — changing it, testing it, switching it on or off, and removing it.
 * Testing them all asks every one that is on, or that Valence turned off, a few at a time.
 *
 * Indexers brought in from a connected Prowlarr say so, and can be brought in again at once rather
 * than at the next hourly sync.
 *
 * Whatever the server said went wrong is shown above the table rather than swallowed, and the list
 * is read again after anything is done so what it shows is what the service now holds.
 */
const IndexersPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(requestsQueries.indexers());
  const apps = useQuery(requestsQueries.arrApps());
  const libraries = useQuery(libraryQueries.all());
  const [isImporting, setIsImporting] = useState(false);
  const [editing, setEditing] = useState<Indexer | null>(null);
  const [searchingOn, setSearchingOn] = useState<Indexer | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);

  useAdminCommand('addIndexer', () => {
    setIsChoosing(true);
  });
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
  const prowlarrs = (apps.data ?? []).filter((app) => app.kind === 'prowlarr');
  const appNames = useMemo(
    () => new Map((apps.data ?? []).map((app) => [app.id, app.name])),
    [apps.data],
  );

  const importFromProwlarr = () => {
    setIsImporting(true);
    setProblem(null);

    void Promise.all(
      prowlarrs.map(async (prowlarr) => ({ prowlarr, sent: await importArrIndexers(prowlarr.id) })),
    )
      .then((outcomes) => {
        const failure =
          outcomes
            .flatMap(({ prowlarr, sent }) =>
              sent.refusal === null
                ? []
                : [
                    say('screens.adminArea.downloadsPanel.nameProblem', {
                      name: prowlarr.name,
                      problem: sent.refusal.message,
                    }),
                  ],
            )
            .join(' ') || null;
        const done = outcomes
          .flatMap(({ prowlarr, sent }) =>
            sent.value === null
              ? []
              : [
                  say('screens.adminArea.indexersPanel.fromNameAddedUpdatedRemoved', {
                    name: prowlarr.name,
                    added: sent.value.added.toString(),
                    updated: sent.value.updated.toString(),
                    removed: sent.value.removed.toString(),
                  }),
                ],
          )
          .join(' ');

        tellOutcome(done, failure);
        setProblem(failure);
      })
      .then(reread)
      .finally(() => {
        setIsImporting(false);
      });
  };

  useAdminCommand('importFromProwlarr', () => {
    void importFromProwlarr();
  });

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

  useAdminCommand('testAllIndexers', () => {
    void testAll();
  });

  const columns = useMemo<DataTableColumn<Indexer>[]>(() => {
    const test = (indexer: Indexer) => {
      setTesting(new Set([indexer.id]));
      setProblem(null);

      void testAndSayWhy(indexer)
        .then((failure) => {
          tellOutcome(say('common.nameAnswered', { name: indexer.name }), failure);
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
              ? say('common.turnedOffName', { name: indexer.name })
              : say('common.turnedOnName', { name: indexer.name }),
            failureOfRefusal(refusal),
          );
          setProblem(refusal?.message ?? null);
        })
        .then(reread);
    };

    return [
      {
        id: 'name',
        header: say('screens.adminArea.indexersPanel.indexer'),
        accessorFn: (indexer) => indexer.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.name}</span>

              {row.original.sourceAppId === null ? null : (
                <Badge size="sm" tone="outline">
                  {say('common.fromName', {
                    name: appNames.get(row.original.sourceAppId) ?? say('common.prowlarr'),
                  })}
                </Badge>
              )}
            </span>

            <span className="truncate text-xs text-text-muted">{row.original.url}</span>
          </span>
        ),
      },
      {
        id: 'privacy',
        header: say('screens.adminArea.indexerCatalogueDialog.privacy'),
        accessorFn: (indexer) => indexer.privacy ?? indexer.kind,
        cell: ({ row }) => {
          const look =
            row.original.privacy === null ? null : INDEXER_PRIVACY_LOOKS[row.original.privacy];

          return look === null ? (
            <Badge size="sm">{KIND_LABELS[row.original.kind]}</Badge>
          ) : (
            <Badge size="sm" tone={look.tone}>
              {look.label}
            </Badge>
          );
        },
      },
      {
        id: 'priority',
        header: say('common.priority'),
        accessorFn: (indexer) => indexer.priority,
        cell: ({ row }) => <span className="text-sm text-text">{row.original.priority}</span>,
      },
      {
        id: 'searches',
        header: say('screens.adminArea.indexersPanel.searches'),
        accessorFn: describeIndexerSearches,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">{describeIndexerSearches(row.original)}</span>
        ),
      },
      {
        id: 'state',
        header: say('common.state'),
        accessorFn: (indexer) => describeIndexerState(indexer).label,
        cell: ({ row }) => {
          const state = describeIndexerState(row.original);

          return testing.has(row.original.id) ? (
            <Badge size="sm" tone="busy">
              {say('screens.adminArea.indexersPanel.testing')}
            </Badge>
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
              label={say('common.actionsForName', { name: row.original.name })}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'edit',
                      label: say('common.change'),
                      icon: <Icon of={PenFilledIcon} size={15} />,
                      onChoose: () => {
                        setEditing(row.original);
                      },
                    },
                    {
                      id: 'test',
                      label: say('common.test'),
                      icon: <Icon of={PlugFilledIcon} size={15} />,
                      isDisabled: testing.size > 0 || isTestingAll,
                      onChoose: () => {
                        test(row.original);
                      },
                    },
                    {
                      id: 'testSearch',
                      label: say('screens.adminArea.indexersPanel.testSearch'),
                      detail: say('screens.adminArea.indexersPanel.searchesItAloneSoYouSee'),
                      icon: <Icon of={SearchListFilledIcon} size={15} />,
                      isDisabled: !row.original.isEnabled,
                      onChoose: () => {
                        setSearchingOn(row.original);
                      },
                    },
                    {
                      id: 'switch',
                      label: row.original.isEnabled
                        ? say('common.switchOff')
                        : say('common.switchOn'),
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
                      label: say('common.forget'),
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
  }, [appNames, isTestingAll, reread, testing]);

  return (
    <PanelCard
      title={say('common.indexers')}
      isFlush
      actions={
        <>
          <PanelCardAction
            icon={PlugFilledIcon}
            isLoading={isTestingAll}
            isDisabled={toTest.length === 0 || testing.size > 0}
            onClick={testAll}
          >
            {say('screens.adminArea.indexersPanel.testAll')}
          </PanelCardAction>

          {prowlarrs.length === 0 ? null : (
            <PanelCardAction
              icon={DownloadFilledIcon}
              isLoading={isImporting}
              onClick={importFromProwlarr}
            >
              {say('screens.adminArea.indexersPanel.importFromProwlarr')}
            </PanelCardAction>
          )}

          <PanelCardAction
            icon={PlusFilledIcon}
            onClick={() => {
              setIsChoosing(true);
            }}
          >
            {say('common.addAnIndexer')}
          </PanelCardAction>
        </>
      }
    >
      <ReleaseSearchDialog
        title={
          searchingOn === null
            ? null
            : say('screens.adminArea.indexersPanel.testSearchOnName', { name: searchingOn.name })
        }
        detail={say('screens.adminArea.indexersPanel.searchesItAloneSoYouSee')}
        indexerIds={searchingOn === null ? [] : [searchingOn.id]}
        onClose={() => {
          setSearchingOn(null);
        }}
      />

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
            ? say('screens.adminArea.indexersPanel.removeThisIndexer')
            : say('common.removeName', { name: removing.name })
        }
        detail={say('screens.adminArea.indexersPanel.itWillNotBeSearchedAgain')}
        confirmLabel={say('common.forget')}
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
                  say('common.removedName', { name: gone.name }),
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

      {isEveryLibraryHandedOff(libraries.data ?? [], ['movies', 'shows', 'anime', 'music']) ? (
        <p className="px-4 pt-3 text-sm text-text-muted">
          {say('screens.adminArea.indexersPanel.everyLibraryHandsOff')}
        </p>
      ) : null}

      {asked.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.indexersPanel.theIndexersCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner
          isCentered
          label={say('screens.adminArea.indexersPanel.readingTheIndexers')}
          size="sm"
        />
      ) : (
        <DataTable
          height="fills"
          label={say('common.indexers')}
          columns={columns}
          rows={asked.data}
          getRowId={(indexer) => indexer.id}
          emptyMessage={say('screens.adminArea.indexersPanel.noIndexersYetAddASite')}
        />
      )}
    </PanelCard>
  );
};

IndexersPanel.displayName = 'IndexersPanel';

export { IndexersPanel };
