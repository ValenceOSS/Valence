import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pen as PenIcon,
  Plus as PlusIcon,
} from '@keyline-icons/react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { removeProfile } from '@ValenceClient/requests/fetchProfiles';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { ProfileEditor } from '@ValenceScreens/components/AdminArea/components/ProfileEditor/ProfileEditor';
import { describeAskers } from './describeAskers';
import { describeProfile } from './describeProfile';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { ProfileKind, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const KINDS: readonly { id: ProfileKind; label: string; empty: string }[] = [
  {
    id: 'video',
    label: 'Films and series',
    empty: 'No profiles for films or series yet.',
  },
  { id: 'music', label: 'Music', empty: 'No profiles for music yet.' },
];

/**
 * The Profiles page: every quality profile, what each takes and how far it upgrades, the libraries
 * it is for, and changing or removing it — a profile opening as a page of its own. Search can be run against any of them.
 */
const ProfilesPanel = () => {
  const cache = useQueryClient();
  const profiles = useQuery(requestsQueries.profiles());
  const libraries = useQuery(libraryQueries.all());
  const [editing, setEditing] = useState<QualityProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [removing, setRemoving] = useState<QualityProfile | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const reread = useCallback(
    () => cache.invalidateQueries({ queryKey: requestsQueries.profiles().queryKey }),
    [cache],
  );

  const named = useMemo(
    () => new Map((libraries.data ?? []).map((library) => [library.id, library.name])),
    [libraries.data],
  );

  const columns = useMemo<DataTableColumn<QualityProfile>[]>(
    () => [
      {
        id: 'name',
        header: 'Profile',
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
        id: 'upgrades',
        header: 'Upgrades',
        accessorFn: (profile) => describeProfile(profile).upgrades,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">{describeProfile(row.original).upgrades}</span>
        ),
      },
      {
        id: 'askers',
        header: 'Who can use it',
        accessorFn: (profile) => describeAskers(profile),
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">{describeAskers(row.original)}</span>
        ),
      },
      {
        id: 'libraries',
        header: 'Used for',
        accessorFn: (profile) => profile.libraryIds.length,
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">
            {row.original.libraryIds.length === 0
              ? 'Every library'
              : row.original.libraryIds
                  .map((id) => named.get(id) ?? 'A library that has gone')
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
              label={`Actions for ${row.original.name}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'change',
                      label: 'Change',
                      icon: <Icon of={PenIcon} size={15} />,
                      onChoose: () => {
                        setEditing(row.original);
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
    ],
    [named],
  );

  return (
    <PanelCard
      title="Profiles"
      isFlush
      actions={
        <PanelCardAction
          icon={PlusIcon}
          onClick={() => {
            setIsAdding(true);
          }}
        >
          Add media profile
        </PanelCardAction>
      }
    >
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
        title={`Remove ${removing?.name ?? 'this profile'}?`}
        detail="Searches can no longer be judged against it, and the libraries it was for will have none."
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
            void removeProfile(gone.id)
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

      {profiles.isError ? (
        <CouldNotRead
          what="The profiles"
          isTryingAgain={profiles.isFetching}
          onTryAgain={() => {
            void profiles.refetch();
          }}
        />
      ) : profiles.isPending ? (
        <Spinner isCentered label="Reading the profiles" size="sm" />
      ) : (
        <div className="flex flex-col gap-6">
          {KINDS.map((kind) => (
            <section key={kind.id} aria-label={kind.label} className="flex flex-col gap-2">
              <h4 className="px-4 text-xs uppercase tracking-[0.14em] text-text-muted">
                {kind.label}
              </h4>

              <DataTable
                label={kind.label}
                columns={columns}
                rows={profiles.data.filter((profile) => profile.kind === kind.id)}
                getRowId={(profile) => profile.id}
                emptyMessage={kind.empty}
              />
            </section>
          ))}
        </div>
      )}
    </PanelCard>
  );
};

ProfilesPanel.displayName = 'ProfilesPanel';

export { ProfilesPanel };
