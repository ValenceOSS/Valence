import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontal as MoreHorizontalIcon,
  Plus as PlusIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Download as DownloadFilledIcon,
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
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  changeArrApp,
  importArrIndexers,
  removeArrApp,
  testArrApp,
} from '@ValenceClient/requests/fetchArrApps';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import { ARR_APP_NAMES } from '@ValenceScreens/components/AdminArea/ARR_APP_NAMES';
import { ArrAppDialog } from '@ValenceScreens/components/AdminArea/components/ArrAppDialog/ArrAppDialog';
import { describeArrAppState } from './describeArrAppState';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import { say } from '@ValenceI18n/say';

/**
 * The Radarr, Sonarr, Lidarr and Prowlarr apps Valence is connected to: how each is, and the things
 * that can be done to one — changing it, testing it, bringing in a Prowlarr's indexers, switching it
 * on or off, and disconnecting it — with whatever went wrong shown above the table.
 */
const ArrAppsPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(requestsQueries.arrApps());
  const [editing, setEditing] = useState<ArrApp | null>(null);
  const [isAdding, setIsAdding] = useState(false);
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
                      id: 'change',
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
                      isDisabled: busyId !== null,
                      onChoose: () => {
                        test(row.original);
                      },
                    },
                    ...(row.original.kind === 'prowlarr'
                      ? [
                          {
                            id: 'import',
                            label: say('screens.adminArea.indexersPanel.importFromProwlarr'),
                            icon: <Icon of={DownloadFilledIcon} size={15} />,
                            isDisabled: busyId !== null,
                            onChoose: () => {
                              importIndexers(row.original);
                            },
                          },
                        ]
                      : []),
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
                      label: say('screens.adminArea.arrAppsPanel.disconnect'),
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
  }, [busyId, reread]);

  return (
    <PanelCard
      title={say('screens.adminArea.arrAppsPanel.connectedApps')}
      isFlush
      actions={
        <PanelCardAction
          icon={PlusIcon}
          onClick={() => {
            setIsAdding(true);
          }}
        >
          {say('screens.adminArea.arrAppDialog.connectAnApp')}
        </PanelCardAction>
      }
    >
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

      <p className="px-4 pt-3 text-xs text-text-muted">
        {say('screens.adminArea.arrAppsPanel.radarrSonarrLidarrAndProwlarrYou')}
      </p>

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
    </PanelCard>
  );
};

ArrAppsPanel.displayName = 'ArrAppsPanel';

export { ArrAppsPanel };
