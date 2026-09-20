import { Icon } from '@ValenceUI/Icon';
import {
  Add01Icon,
  Alert02Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { DataTable } from '@ValenceUI/DataTable';
import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { PermissionEditor } from './components/PermissionEditor/PermissionEditor';
import { ColorSwatchPicker } from './components/ColorSwatchPicker/ColorSwatchPicker';
import { RoleMembers } from './components/RoleMembers/RoleMembers';
import {
  assignRole,
  createRole,
  deleteRole,
  removeRole,
  updateRole,
} from '@ValenceClient/admin/fetchRoles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { Refusal } from '@ValenceClient/admin/fetchRoles';
import type { Permission, Role } from '@ValenceContracts/schemas/Permission';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';

const NEW_ROLE_POSITION = 50;

const NO_ROLES: Role[] = [];

const NO_PERMISSIONS: Permission[] = [];

const NO_ACCOUNTS: Account[] = [];

const EDIT_TABS = ['display', 'permissions', 'members'] as const;

type EditTab = (typeof EDIT_TABS)[number];

/**
 * Whether a string the tab row handed back actually names one of the edit dialog's tabs.
 *
 * @param value - What was chosen.
 * @returns Whether it names a tab.
 */
const isEditTab = (value: string): value is EditTab => EDIT_TABS.some((tab) => tab === value);

/**
 * The roles on this server, what each grants and who holds them, with the making and changing of
 * them. Permissions are offered grouped by what they are about rather than as one long list, since
 * choosing from a hundred flat checkboxes is how a role ends up granting something nobody meant.
 */
const RolesPanel = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<EditTab>('display');
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRolePosition, setNewRolePosition] = useState(NEW_ROLE_POSITION.toString());
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<Refusal>(null);
  const [draftName, setDraftName] = useState('');
  const [draftPosition, setDraftPosition] = useState('');
  const [draftColor, setDraftColor] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<Permission[]>([]);
  const [draftMemberIds, setDraftMemberIds] = useState<ReadonlySet<string>>(new Set());

  const cache = useQueryClient();

  const askedRoles = useQuery(adminQueries.roles());
  const askedCatalogue = useQuery(adminQueries.permissions());
  const askedAccounts = useQuery(adminQueries.accounts());

  const roles = askedRoles.data ?? NO_ROLES;
  const catalogue = askedCatalogue.data ?? NO_PERMISSIONS;
  const accounts = askedAccounts.data ?? NO_ACCOUNTS;
  const couldNotRead = askedRoles.isError || askedCatalogue.isError;

  const reload = useCallback(
    async () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: adminQueries.roles().queryKey }),
        cache.invalidateQueries({ queryKey: adminQueries.accounts().queryKey }),
      ]),
    [cache],
  );

  useEffect(() => {
    const picked = roles.find((candidate) => candidate.id === selectedRoleId) ?? null;

    setDraftName(picked?.name ?? '');
    setDraftPosition(picked === null ? '' : picked.position.toString());
    setDraftColor(picked?.color ?? null);
    setDraftPermissions(picked?.permissions ?? []);
    setDraftMemberIds(
      new Set(
        picked === null
          ? []
          : accounts
              .filter((account) => account.roles.includes(picked.name))
              .map((account) => account.id),
      ),
    );
  }, [selectedRoleId, roles, accounts]);

  const act = useCallback(
    async (run: () => Promise<Refusal>) => {
      const outcome = await run();

      setRefusal(outcome);

      if (outcome === null) {
        await reload();
      }

      return outcome;
    },
    [reload],
  );

  const selected = roles.find((role) => role.id === selectedRoleId) ?? null;
  const travel = useTravelDirection([...EDIT_TABS], editTab);
  const memberCount = draftMemberIds.size;

  const hasUnsavedChanges =
    selected !== null &&
    (draftName !== selected.name ||
      draftPosition !== selected.position.toString() ||
      draftColor !== selected.color ||
      draftPermissions.length !== selected.permissions.length ||
      draftPermissions.some((permission) => !selected.permissions.includes(permission)) ||
      draftMemberIds.size !==
        accounts.filter((account) => account.roles.includes(selected.name)).length ||
      accounts.some(
        (account) => account.roles.includes(selected.name) !== draftMemberIds.has(account.id),
      ));

  const saveChanges = useCallback(async () => {
    if (selected === null) {
      return;
    }

    const position = Number.parseInt(draftPosition, 10);
    const patch: Partial<Omit<Role, 'id'>> = {};

    if (draftName !== selected.name) {
      patch.name = draftName;
    }

    if (!Number.isNaN(position) && position !== selected.position) {
      patch.position = position;
    }

    if (draftColor !== selected.color) {
      patch.color = draftColor;
    }

    if (
      draftPermissions.length !== selected.permissions.length ||
      draftPermissions.some((permission) => !selected.permissions.includes(permission))
    ) {
      patch.permissions = draftPermissions;
    }

    if (Object.keys(patch).length > 0) {
      const outcome = await updateRole(selected.id, patch);

      if (outcome !== null) {
        setRefusal(outcome);
        return;
      }
    }

    const heldIds = new Set(
      accounts
        .filter((account) => account.roles.includes(selected.name))
        .map((account) => account.id),
    );

    for (const accountId of draftMemberIds) {
      if (heldIds.has(accountId)) {
        continue;
      }

      const outcome = await assignRole(accountId, selected.id);

      if (outcome !== null) {
        setRefusal(outcome);
        return;
      }
    }

    for (const accountId of heldIds) {
      if (draftMemberIds.has(accountId)) {
        continue;
      }

      const outcome = await removeRole(accountId, selected.id);

      if (outcome !== null) {
        setRefusal(outcome);
        return;
      }
    }

    setRefusal(null);
    await reload();
  }, [
    selected,
    draftName,
    draftPosition,
    draftColor,
    draftPermissions,
    draftMemberIds,
    accounts,
    reload,
  ]);

  const live = useRef({
    onEdit: (id: string) => {
      setSelectedRoleId(id);
      setEditTab('display');
      setRefusal(null);
    },
    onAskDelete: (role: Role) => {
      setDeleting(role);
    },
  });

  const columns = useMemo<DataTableColumn<Role>[]>(
    () => [
      {
        id: 'name',
        header: 'Role',
        accessorFn: (role) => role.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full bg-subtle"
              style={row.original.color === null ? {} : { backgroundColor: row.original.color }}
            />

            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <span className="truncate text-xs text-text-muted">
                {row.original.permissions.includes('administrator')
                  ? 'Everything'
                  : row.original.permissions.length === 1
                    ? '1 permission'
                    : `${row.original.permissions.length.toString()} permissions`}
              </span>
            </span>
          </span>
        ),
      },
      {
        id: 'position',
        header: 'Rank',
        accessorFn: (role) => role.position,
        cell: ({ row }) => <Badge size="sm">{row.original.position.toString()}</Badge>,
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
                      label: 'Edit role',
                      icon: <Icon of={PencilEdit01Icon} size={15} />,
                      onChoose: () => {
                        live.current.onEdit(row.original.id);
                      },
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'delete',
                      label: 'Delete role',
                      icon: <Icon of={Delete02Icon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        live.current.onAskDelete(row.original);
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
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {refusal === null || selected !== null ? null : (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-text"
        >
          <Icon of={Alert02Icon} size={18} className="mt-0.5 shrink-0 text-danger" />
          {refusal.message}
        </p>
      )}

      <PanelCard
        title="Roles"
        isFlush
        actions={
          <Button
            variant="secondary"
            size="xs"
            onClick={() => {
              setIsCreating(true);
            }}
          >
            Create role
            <Icon of={Add01Icon} size={15} />
          </Button>
        }
      >
        {couldNotRead ? (
          <CouldNotRead
            what="The roles"
            isTryingAgain={askedRoles.isFetching || askedCatalogue.isFetching}
            onTryAgain={() => {
              void askedRoles.refetch();
              void askedCatalogue.refetch();
            }}
          />
        ) : (
          <DataTable
            label="Roles"
            columns={columns}
            rows={roles}
            height="fill"
            emptyMessage="No roles yet."
          />
        )}
      </PanelCard>

      <DialogCompanion
        label="Create a role"
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
        }}
      >
        <DialogTitle
          size="compact"
          title="Create a role"
          detail="A role is a name and a set of permissions. Rank decides who may manage whom."
        />

        <DialogContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-3">
            <TextField
              label="Name"
              value={newRoleName}
              onValueChange={setNewRoleName}
              placeholder="Housemate"
              className="min-w-48 flex-1"
            />

            <TextField
              label="Rank"
              type="number"
              min={0}
              value={newRolePosition}
              onValueChange={setNewRolePosition}
              className="w-24 shrink-0"
            />
          </div>

          <FormField label="Colour" description="Shown wherever somebody holding this role is.">
            <ColorSwatchPicker value={newRoleColor} onChange={setNewRoleColor} />
          </FormField>

          <PermissionEditor
            catalogue={catalogue}
            selected={newRolePermissions}
            onToggle={(permission) => {
              setNewRolePermissions((held) =>
                held.includes(permission)
                  ? held.filter((candidate) => candidate !== permission)
                  : [...held, permission],
              );
            }}
          />
        </DialogContent>

        <DialogFooter
          dismiss={{
            onChoose: () => {
              setIsCreating(false);
            },
          }}
          confirm={{
            label: 'Create role',
            onChoose: () => {
              const position = Number.parseInt(newRolePosition, 10);

              void act(() =>
                createRole({
                  name: newRoleName,
                  position: Number.isNaN(position) ? NEW_ROLE_POSITION : position,
                  color: newRoleColor,
                  permissions: newRolePermissions,
                }),
              ).then(() => {
                setNewRoleName('');
                setNewRolePosition(NEW_ROLE_POSITION.toString());
                setNewRolePermissions([]);
                setNewRoleColor(null);
                setIsCreating(false);
              });
            },
            isDisabled: newRoleName === '',
          }}
        />
      </DialogCompanion>

      <ConfirmDialog
        title="Delete this role?"
        detail={
          deleting === null
            ? ''
            : `${deleting.name} will be removed, and anybody holding it loses what it granted. This cannot be undone.`
        }
        confirmLabel="Delete role"
        isDestructive
        isOpen={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          const role = deleting;

          setDeleting(null);

          if (role !== null) {
            void act(() => deleteRole(role.id));
          }
        }}
      />

      <DialogCompanion
        label={selected === null ? 'Edit role' : `Edit ${selected.name}`}
        isOpen={selected !== null}
        onClose={() => {
          setSelectedRoleId(null);
        }}
      >
        {selected === null ? null : (
          <Tabs
            value={editTab}
            onValueChange={(next) => {
              if (isEditTab(next)) {
                setEditTab(next);
              }
            }}
          >
            <DialogTitle
              size="compact"
              title={`Edit ${selected.name}`}
              detail="A higher rank manages a lower one. Nobody may touch a role at or above their own."
              below={
                <TabRow
                  label="What to change about this role"
                  tone="underlined"
                  size="sm"
                  value={editTab}
                  groups={[
                    {
                      items: [
                        { id: 'display', label: 'Display' },
                        { id: 'permissions', label: 'Permissions' },
                        { id: 'members', label: `Manage members (${memberCount.toString()})` },
                      ],
                    },
                  ]}
                />
              }
            />

            <DialogContent className="flex min-h-[28rem] max-h-[32rem] flex-col gap-5">
              {refusal === null ? null : (
                <p
                  role="alert"
                  className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-text"
                >
                  <Icon of={Alert02Icon} size={16} className="mt-0.5 shrink-0 text-danger" />
                  {refusal.message}
                </p>
              )}

              <TabPanel value="display" travel={travel}>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-end gap-3">
                    <TextField
                      label="Name"
                      value={draftName}
                      onValueChange={setDraftName}
                      className="min-w-48 flex-1"
                    />

                    <TextField
                      label="Rank"
                      type="number"
                      min={0}
                      value={draftPosition}
                      onValueChange={setDraftPosition}
                      className="w-24 shrink-0"
                    />
                  </div>

                  <FormField
                    label="Colour"
                    description="Shown wherever somebody holding this role is."
                  >
                    <ColorSwatchPicker value={draftColor} onChange={setDraftColor} />
                  </FormField>
                </div>
              </TabPanel>

              <TabPanel value="permissions" travel={travel}>
                <PermissionEditor
                  catalogue={catalogue}
                  selected={draftPermissions}
                  onToggle={(permission) => {
                    setDraftPermissions((held) =>
                      held.includes(permission)
                        ? held.filter((candidate) => candidate !== permission)
                        : [...held, permission],
                    );
                  }}
                />
              </TabPanel>

              <TabPanel value="members" travel={travel}>
                <RoleMembers
                  accounts={accounts}
                  heldIds={draftMemberIds}
                  onToggle={(accountId) => {
                    setDraftMemberIds((held) => {
                      const next = new Set(held);

                      if (next.has(accountId)) {
                        next.delete(accountId);
                      } else {
                        next.add(accountId);
                      }

                      return next;
                    });
                  }}
                />
              </TabPanel>
            </DialogContent>

            <DialogFooter
              dismiss={{
                label: 'Close',
                onChoose: () => {
                  setSelectedRoleId(null);
                },
              }}
              confirm={{
                label: 'Save changes',
                onChoose: () => {
                  void saveChanges();
                },
                isDisabled: draftName === '' || !hasUnsavedChanges,
              }}
            />
          </Tabs>
        )}
      </DialogCompanion>
    </div>
  );
};

RolesPanel.displayName = 'RolesPanel';

export { RolesPanel };
