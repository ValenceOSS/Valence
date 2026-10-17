import { rowActionsColumn } from '@ValenceUI/DataTable/rowActionsColumn';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinFilledIcon,
  Download as DownloadFilledIcon,
  Pen as PenFilledIcon,
  Plug as PlugFilledIcon,
  Plus as PlusFilledIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  changeArrApp,
  importArrIndexers,
  removeArrApp,
  testArrApp,
} from '@ValenceClient/requests/fetchArrApps';
import { PanelCard } from '@ValenceUI/PanelCard';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { ARR_APP_NAMES } from '@ValenceScreens/components/AdminArea/ARR_APP_NAMES';
import { ArrAppDialog } from '@ValenceScreens/components/AdminArea/components/ArrAppDialog/ArrAppDialog';
import { describeArrAppState } from './describeArrAppState';
import { ArrImportDialog } from './components/ArrImportDialog/ArrImportDialog';
import { ConnectedAppsControl } from './components/ConnectedAppsControl/ConnectedAppsControl';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { say } from '@ValenceI18n/say';

/**
 * The Radarr, Sonarr, Lidarr and Prowlarr apps Valence is connected to: how each is, and the things
 * that can be done to one — changing it, testing it, bringing in a Prowlarr's indexers, switching it
 * on or off, and disconnecting it — with whatever went wrong shown above the table, and whether
 * Valence works the apps from a title's page.
 */
const ArrAppsPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(requestsQueries.arrApps());
  const [editing, setEditing] = useState<ArrApp | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useAdminCommand('connectApp', () => {
    setIsAdding(true);
  });
  const [isImporting, setIsImporting] = useState(false);

  useAdminCommand('bringInASetup', () => {
    setIsImporting(true);
  });
  const [removing, setRemoving] = useState<ArrApp | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const reread = useCallback(
    () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: requestsQueries.arrApps().queryKey }),
        cache.invalidateQueries({ queryKey: requestsQueries.indexers().queryKey }),
      ]),
    [cache],
  );

  const columns = useMemo<DataTableColumn<ArrApp>[]>(() => {
    const test = (app: ArrApp) => {
      setBusyId(app.id);
      setProblem(null);

      void testArrApp(app.id)
        .then(({ value, refusal }) => {
          const failure =
            refusal?.message ??
            (value?.isWorking === false
              ? say('screens.adminArea.downloadsPanel.nameProblem', {
                  name: app.name,
                  problem: sayAgainIfAny(value.problem) ?? say('common.itDidNotAnswer'),
                })
              : null);

          tellOutcome(say('common.nameAnswered', { name: app.name }), failure);
          setProblem(failure);
        })
        .then(reread)
        .finally(() => {
          setBusyId(null);
        });
    };

    const importIndexers = (app: ArrApp) => {
      setBusyId(app.id);
      setProblem(null);

      void importArrIndexers(app.id)
        .then(({ value, refusal }) => {
          tellOutcome(
            value === null
              ? ''
              : say('screens.adminArea.indexersPanel.fromNameAddedUpdatedRemoved', {
                  name: app.name,
                  added: value.added.toString(),
                  updated: value.updated.toString(),
                  removed: value.removed.toString(),
                }),
            failureOfRefusal(refusal),
          );
          setProblem(refusal?.message ?? null);
        })
        .then(reread)
        .finally(() => {
          setBusyId(null);
        });
    };

    const switchOnOrOff = (app: ArrApp) => {
      setProblem(null);

      void changeArrApp(app.id, { isEnabled: !app.isEnabled })
        .then(({ refusal }) => {
          tellOutcome(
            app.isEnabled
              ? say('common.turnedOffName', { name: app.name })
              : say('common.turnedOnName', { name: app.name }),
            failureOfRefusal(refusal),
          );
          setProblem(refusal?.message ?? null);
        })
        .then(reread);
    };

    return [
      {
        id: 'name',
        header: say('screens.adminArea.arrAppDialog.app'),
        accessorFn: (app) => app.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <Badge size="sm">{ARR_APP_NAMES[row.original.kind]}</Badge>
            </span>

            <span className="truncate text-xs text-text-muted">{row.original.url}</span>
          </span>
        ),
      },
      {
        id: 'state',
        header: say('common.state'),
        accessorFn: (app) => describeArrAppState(app).label,
        cell: ({ row }) => {
          const state = describeArrAppState(row.original);

          return busyId === row.original.id ? (
            <Spinner size="sm" label={say('common.testingName', { name: row.original.name })} />
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
      rowActionsColumn(
        (item) => item.name,
        (item) => [
          {
            items: [
              {
                id: 'change',
                label: say('common.change'),
                icon: <Icon of={PenFilledIcon} size={15} />,
                onChoose: () => {
                  setEditing(item);
                },
              },
              {
                id: 'test',
                label: say('common.test'),
                icon: <Icon of={PlugFilledIcon} size={15} />,
                isDisabled: busyId !== null,
                onChoose: () => {
                  test(item);
                },
              },
              ...(item.kind === 'prowlarr'
                ? [
                    {
                      id: 'import',
                      label: say('screens.adminArea.indexersPanel.importFromProwlarr'),
                      icon: <Icon of={DownloadFilledIcon} size={15} />,
                      isDisabled: busyId !== null,
                      onChoose: () => {
                        importIndexers(item);
                      },
                    },
                  ]
                : []),
              {
                id: 'switch',
                label: item.isEnabled ? say('common.switchOff') : say('common.switchOn'),
                icon: <Icon of={item.isEnabled ? ToggleOffIcon : ToggleOnIcon} size={15} />,
                onChoose: () => {
                  switchOnOrOff(item);
                },
              },
            ],
          },
          {
            items: [
              {
                id: 'remove',
                label: say('screens.adminArea.arrAppsPanel.disconnect'),
                icon: <Icon of={BinFilledIcon} size={15} />,
                isDestructive: true,
                onChoose: () => {
                  setRemoving(item);
                },
              },
            ],
          },
        ],
      ),
    ];
  }, [busyId, reread]);

  return (
    <PanelCard
      title={say('screens.adminArea.arrAppsPanel.connectedApps')}
      isFlush
      actions={
        <>
          <PanelCardAction
            icon={DownloadFilledIcon}
            onClick={() => {
              setIsImporting(true);
            }}
          >
            {say('screens.adminArea.arrAppsPanel.bringInASetup')}
          </PanelCardAction>
          <PanelCardAction
            icon={PlusFilledIcon}
            onClick={() => {
              setIsAdding(true);
            }}
          >
            {say('screens.adminArea.arrAppDialog.connectAnApp')}
          </PanelCardAction>
          <PanelCardInfo
            label={say('screens.adminArea.statStrip.aboutLabel', {
              label: say('screens.adminArea.arrAppsPanel.connectedApps'),
            })}
            detail={say('screens.adminArea.arrAppsPanel.radarrSonarrLidarrAndProwlarrYou')}
          />
        </>
      }
    >
      <ArrImportDialog
        isOpen={isImporting}
        onClose={() => {
          setIsImporting(false);
          void reread();
        }}
      />

      <ArrAppDialog
        isOpen={isAdding || editing !== null}
        app={editing}
        onClose={() => {
          setIsAdding(false);
          setEditing(null);
        }}
        onSaved={() => {
          void reread();
        }}
      />

      <ConfirmDialog
        title={
          removing === null
            ? say('screens.adminArea.arrAppsPanel.disconnect')
            : say('screens.adminArea.arrAppsPanel.disconnectName', { name: removing.name })
        }
        detail={
          removing?.kind === 'prowlarr'
            ? say('screens.adminArea.arrAppsPanel.theIndexersItBroughtInAre')
            : say('screens.adminArea.arrAppsPanel.nothingIsRemovedFromTheApp')
        }
        confirmLabel={say('screens.adminArea.arrAppsPanel.disconnect')}
        isDestructive
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          const gone = removing;

          setRemoving(null);

          if (gone !== null) {
            void removeArrApp(gone.id)
              .then((refusal) => {
                tellOutcome(
                  say('screens.adminArea.arrAppsPanel.disconnectedName', { name: gone.name }),
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
          said={say('screens.adminArea.arrAppsPanel.theConnectedAppsCouldNotBe')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner
          isCentered
          label={say('screens.adminArea.arrAppsPanel.readingTheConnectedApps')}
          size="sm"
        />
      ) : (
        <DataTable
          label={say('screens.adminArea.arrAppsPanel.connectedApps')}
          columns={columns}
          rows={asked.data}
          getRowId={(app) => app.id}
          emptyMessage={say('screens.adminArea.arrAppsPanel.noneYetConnectARadarrSonarr')}
        />
      )}

      <ConnectedAppsControl />
    </PanelCard>
  );
};

ArrAppsPanel.displayName = 'ArrAppsPanel';

export { ArrAppsPanel };
