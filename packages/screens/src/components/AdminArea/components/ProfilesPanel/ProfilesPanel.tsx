import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown as ArrowDownFilledIcon,
  ArrowUp as ArrowUpFilledIcon,
  Bin as BinFilledIcon,
  GripVertical as GripVerticalIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pen as PenFilledIcon,
  Plus as PlusFilledIcon,
  SearchList as SearchListFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ReleaseSearchDialog } from '@ValenceScreens/components/AdminArea/components/ReleaseSearchDialog/ReleaseSearchDialog';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { TabPanel } from '@ValenceUI/TabPanel';
import { PanelCardChoice } from '@ValenceScreens/components/PanelCardChoice/PanelCardChoice';
import { Tabs } from '@ValenceUI/Tabs';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { isEveryLibraryHandedOff } from '@ValenceClient/requests/isEveryLibraryHandedOff';
import { removeProfile, reorderProfiles } from '@ValenceClient/requests/fetchProfiles';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { ProfileEditor } from '@ValenceScreens/components/AdminArea/components/ProfileEditor/ProfileEditor';
import { describeAskers } from './describeAskers';
import { describeProfile } from './describeProfile';
import { moveProfile } from './moveProfile';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { ProfileKind, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { say } from '@ValenceI18n/say';

const KINDS: readonly { id: ProfileKind | 'all'; label: string; empty: string }[] = [
  {
    id: 'all',
    label: say('common.all'),
    empty: say('screens.adminArea.profilesPanel.noProfilesYet'),
  },
  {
    id: 'video',
    label: say('common.filmsAndSeries'),
    empty: say('screens.adminArea.profilesPanel.noProfilesForFilmsOrSeries'),
  },
  {
    id: 'music',
    label: say('common.music'),
    empty: say('screens.adminArea.profilesPanel.noProfilesForMusicYet'),
  },
];

/**
 * Whether a tab name is one of the kinds a profile can be, or every kind at once.
 *
 * @param value - What the tabs said.
 * @returns Whether it names what to show.
 */
const isProfileKind = (value: string): value is ProfileKind | 'all' =>
  KINDS.some((kind) => kind.id === value);

/**
 * The Profiles page: every quality profile, highest first, what each takes and how far it upgrades,
 * the libraries it is for, and moving, changing or removing it — a profile opening as a page of its
 * own. Search can be run against any of them. Profiles of a kind no library takes requests for say
 * they aren't used.
 */
const ProfilesPanel = () => {
  const requestable = useRequestableKinds();
  const isKnown = useQuery(requestsQueries.availability()).data !== undefined;
  const isUnused = (kind: ProfileKind) =>
    isKnown &&
    (kind === 'video'
      ? !requestable.has('film') && !requestable.has('series')
      : !requestable.has('artist') && !requestable.has('album'));

  const cache = useQueryClient();
  const profiles = useQuery(requestsQueries.profiles());
  const libraries = useQuery(libraryQueries.all());
  const [editing, setEditing] = useState<QualityProfile | null>(null);
  const [trying, setTrying] = useState<QualityProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [shown, setShown] = useState<ProfileKind | 'all'>('all');
  const [removing, setRemoving] = useState<QualityProfile | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const putInOrder = async (moved: readonly string[]) => {
    const every = profiles.data ?? [];
    const slots = every.map((profile) => moved.includes(profile.id));
    let next = 0;
    const ids = every.map((profile, at) => {
      if (slots[at] !== true) {
        return profile.id;
      }

      next += 1;

      return moved[next - 1] ?? profile.id;
    });
    const byId = new Map(every.map((profile) => [profile.id, profile]));

    cache.setQueryData(
      requestsQueries.profiles().queryKey,
      ids.flatMap((id) => {
        const profile = byId.get(id);

        return profile === undefined ? [] : [profile];
      }),
    );

    const { refusal } = await reorderProfiles(ids);

    tellOutcome(
      say('screens.adminArea.profilesPanel.profilesPutInOrder'),
      failureOfRefusal(refusal),
    );
    void cache.invalidateQueries({ queryKey: requestsQueries.profiles().queryKey });
  };

  const reread = useCallback(
    () => cache.invalidateQueries({ queryKey: requestsQueries.profiles().queryKey }),
    [cache],
  );

  const move = useCallback(
    (profile: QualityProfile, by: -1 | 1) => {
      const ids = moveProfile(profiles.data ?? [], profile.id, by);

      if (ids === null) {
        return;
      }

      void reorderProfiles(ids)
        .then(({ refusal }) => {
          setProblem(refusal?.message ?? null);
        })
        .then(reread);
    },
    [profiles.data, reread],
  );

  const named = useMemo(
    () => new Map((libraries.data ?? []).map((library) => [library.id, library.name])),
    [libraries.data],
  );

  const columns = useMemo<DataTableColumn<QualityProfile>[]>(
    () => [
      {
        id: 'drag',
        header: '',
        enableSorting: false,
        meta: { shrinks: true },
        cell: () => (
          <Icon
            of={GripVerticalIcon}
            size={16}
            tone="muted"
            label={say('screens.adminArea.profilesPanel.dragToChangeTheOrder')}
          />
        ),
      },
      {
        id: 'name',
        header: say('common.profile'),
        accessorFn: (profile) => profile.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-text">{row.original.name}</span>

            <span className="truncate text-xs text-text-muted">
              {describeProfile(row.original).takes}
            </span>
          </span>
        ),
      },
      {
        id: 'kind',
        header: say('common.kind'),
        accessorFn: (profile) => profile.kind,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">
            {KINDS.find((kind) => kind.id === row.original.kind)?.label}
          </span>
        ),
      },
      {
        id: 'upgrades',
        header: say('common.upgrades'),
        accessorFn: (profile) => describeProfile(profile).upgrades,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">{describeProfile(row.original).upgrades}</span>
        ),
      },
      {
        id: 'askers',
        header: say('common.whoCanUseIt'),
        accessorFn: (profile) => describeAskers(profile),
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">{describeAskers(row.original)}</span>
        ),
      },
      {
        id: 'libraries',
        header: say('common.usedFor'),
        accessorFn: (profile) => profile.libraryIds.length,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">
            {row.original.libraryIds.length === 0
              ? say('common.everyLibrary2')
              : row.original.libraryIds
                  .map((id) => named.get(id) ?? say('common.aLibraryThatHasGone'))
                  .join(', ')}
          </span>
        ),
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
                    ...(moveProfile(profiles.data ?? [], row.original.id, -1) === null
                      ? []
                      : [
                          {
                            id: 'up',
                            label: say('common.moveUp'),
                            icon: <Icon of={ArrowUpFilledIcon} size={15} />,
                            onChoose: () => {
                              move(row.original, -1);
                            },
                          },
                        ]),
                    ...(moveProfile(profiles.data ?? [], row.original.id, 1) === null
                      ? []
                      : [
                          {
                            id: 'down',
                            label: say('common.moveDown'),
                            icon: <Icon of={ArrowDownFilledIcon} size={15} />,
                            onChoose: () => {
                              move(row.original, 1);
                            },
                          },
                        ]),
                    {
                      id: 'try',
                      label: say('screens.adminArea.profilesPanel.tryIt'),
                      detail: say('screens.adminArea.profilesPanel.searchesTheIndexersAndShows'),
                      icon: <Icon of={SearchListFilledIcon} size={15} />,
                      onChoose: () => {
                        setTrying(row.original);
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
    ],
    [named, profiles.data, move],
  );

  return (
    <Tabs
      value={shown}
      onValueChange={(next) => {
        if (isProfileKind(next)) {
          setShown(next);
        }
      }}
    >
      <PanelCard
        title={say('common.profiles')}
        isFlush
        actions={
          <>
            <PanelCardChoice
              label={say('screens.adminArea.profilesPanel.whichProfilesToShow')}
              options={KINDS.map(({ id, label }) => ({ id, label }))}
              value={shown}
              onSelect={(next) => {
                if (isProfileKind(next)) {
                  setShown(next);
                }
              }}
            />
            <PanelCardAction
              icon={PlusFilledIcon}
              onClick={() => {
                setIsAdding(true);
              }}
            >
              {say('common.addMediaProfile')}
            </PanelCardAction>
          </>
        }
      >
        <ReleaseSearchDialog
          title={
            trying === null
              ? null
              : say('screens.adminArea.profilesPanel.tryName', { name: trying.name })
          }
          detail={say('screens.adminArea.profilesPanel.searchesTheIndexersAndShows')}
          profileId={trying?.id ?? null}
          onClose={() => {
            setTrying(null);
          }}
        />

        <ProfileEditor
          isOpen={isAdding || editing !== null}
          profile={editing}
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
              ? say('screens.adminArea.profilesPanel.removeThisProfile')
              : say('common.removeName', { name: removing.name })
          }
          detail={say('screens.adminArea.profilesPanel.searchesCanNoLongerBeJudged')}
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
              void removeProfile(gone.id)
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

        {profiles.isError ? (
          <CouldNotRead
            said={say('screens.adminArea.profilesPanel.theProfilesCouldNotBeRead')}
            isTryingAgain={profiles.isFetching}
            onTryAgain={() => {
              void profiles.refetch();
            }}
          />
        ) : profiles.isPending ? (
          <Spinner isCentered label={say('screens.profileGate.readingWhoIsHere')} size="sm" />
        ) : (
          KINDS.map((kind) => (
            <TabPanel key={kind.id} value={kind.id}>
              <p className="px-4 pt-3 text-sm text-text-muted">
                {say('screens.adminArea.profilesPanel.highestFirst')}
              </p>

              {isEveryLibraryHandedOff(
                libraries.data ?? [],
                kind.id === 'video'
                  ? ['movies', 'shows', 'anime']
                  : kind.id === 'music'
                    ? ['music']
                    : ['movies', 'shows', 'anime', 'music'],
              ) ? (
                <p className="px-4 pt-3 text-sm text-text-muted">
                  {say('screens.adminArea.profilesPanel.everyLibraryHandsOff')}
                </p>
              ) : null}

              {kind.id !== 'all' && isUnused(kind.id) ? (
                <p className="px-4 pt-3 text-sm text-text-muted">
                  {kind.id === 'video'
                    ? say('screens.adminArea.profilesPanel.noVideoLibraryTakesRequests')
                    : say('screens.adminArea.profilesPanel.noMusicLibraryTakesRequests')}
                </p>
              ) : null}

              <DataTable
                height="fills"
                label={kind.label}
                columns={
                  kind.id === 'all' ? columns : columns.filter((column) => column.id !== 'kind')
                }
                rows={profiles.data.filter(
                  (profile) => kind.id === 'all' || profile.kind === kind.id,
                )}
                getRowId={(profile) => profile.id}
                onReorder={(ids) => {
                  void putInOrder(ids);
                }}
                emptyMessage={kind.empty}
              />
            </TabPanel>
          ))
        )}
      </PanelCard>
    </Tabs>
  );
};

ProfilesPanel.displayName = 'ProfilesPanel';

export { ProfilesPanel };
