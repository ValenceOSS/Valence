import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Icon } from '@ValenceUI/Icon';
import {
  Bin as BinFilledIcon,
  MoreHorizontal as MoreHorizontalIcon,
  PenLine as PenLineFilledIcon,
  Plus as PlusFilledIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react/fill';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { DataTable } from '@ValenceUI/DataTable';
import { FormField } from '@ValenceUI/FormField';
import { Form } from '@ValenceUI/Form';
import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { RoleFormSchema } from './RoleFormSchema';
import { A_NEW_ROLE } from './A_NEW_ROLE';
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
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import type { GrantedPermission, Permission, Role } from '@ValenceContracts/schemas/Permission';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

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
  const [refusal, setRefusal] = useState<Refusal>(null);
  const [draftMemberIds, setDraftMemberIds] = useState<ReadonlySet<string>>(new Set());

  const cache = useQueryClient();

  const askedRoles = useQuery(adminQueries.roles());
  const askedCatalogue = useQuery(adminQueries.permissions());
  const askedAccounts = useQuery(adminQueries.accounts());
  const askedPlugins = useQuery(pluginQueries.contributions());

  const roles = askedRoles.data ?? NO_ROLES;
  const catalogue = askedCatalogue.data ?? NO_PERMISSIONS;
  const pluginNodes = askedPlugins.data?.nodes;
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

  const selected = roles.find((role) => role.id === selectedRoleId) ?? null;

  const creating = useZodForm(RoleFormSchema, A_NEW_ROLE, async (answers, { reset }) => {
    const refused = await createRole(answers);

    if (refused !== null) {
      return refused.message;
    }

    tellOutcome(
      say('screens.adminArea.rolesPanel.createdTheNewRoleNameRole', { newRoleName: answers.name }),
      null,
    );
    await reload();
    reset(A_NEW_ROLE);
    setIsCreating(false);

    return null;
  });

  const editing = useZodForm(RoleFormSchema, A_NEW_ROLE, async (answers) => {
    if (selected === null) {
      return null;
    }

    const patch: Partial<Omit<Role, 'id'>> = {};

    if (answers.name !== selected.name) {
      patch.name = answers.name;
    }

    if (answers.position !== selected.position) {
      patch.position = answers.position;
    }

    if (answers.color !== selected.color) {
      patch.color = answers.color;
    }

    if (
      answers.permissions.length !== selected.permissions.length ||
      answers.permissions.some((permission) => !selected.permissions.includes(permission))
    ) {
      patch.permissions = answers.permissions;
    }

    if (Object.keys(patch).length > 0) {
      const outcome = await updateRole(selected.id, patch);

      if (outcome !== null) {
        return outcome.message;
      }
    }

    const heldIds = new Set(
      accounts
        .filter((account) => account.roles.includes(selected.name))
        .map((account) => account.id),
    );

    for (const accountId of draftMemberIds) {
      if (!heldIds.has(accountId)) {
        const outcome = await assignRole(accountId, selected.id);

        if (outcome !== null) {
          return outcome.message;
        }
      }
    }

    for (const accountId of heldIds) {
      if (!draftMemberIds.has(accountId)) {
        const outcome = await removeRole(accountId, selected.id);

        if (outcome !== null) {
          return outcome.message;
        }
      }
    }

    tellOutcome(say('screens.adminArea.rolesPanel.roleSaved'), null);
    await reload();

    return null;
  });

  const resetEditing = editing.reset;

  useEffect(() => {
    const picked = roles.find((candidate) => candidate.id === selectedRoleId) ?? null;

    resetEditing(
      picked === null
        ? A_NEW_ROLE
        : {
            name: picked.name,
            position: picked.position.toString(),
            color: picked.color,
            permissions: picked.permissions,
          },
    );
    setDraftMemberIds(
      new Set(
        picked === null
          ? []
          : accounts
              .filter((account) => account.roles.includes(picked.name))
              .map((account) => account.id),
      ),
    );
  }, [selectedRoleId, roles, accounts, resetEditing]);

  const act = useCallback(
    async (run: () => Promise<Refusal>, done: string) => {
      const outcome = await run();

      setRefusal(outcome);
      tellOutcome(done, failureOfRefusal(outcome));

      if (outcome === null) {
        await reload();
      }

      return outcome;
    },
    [reload],
  );

  const travel = useTravelDirection([...EDIT_TABS], editTab);
  const memberCount = draftMemberIds.size;

  const draft = editing.values;
  const hasUnsavedChanges =
    selected !== null &&
    (draft.name !== selected.name ||
      draft.position !== selected.position.toString() ||
      draft.color !== selected.color ||
      draft.permissions.length !== selected.permissions.length ||
      draft.permissions.some((permission) => !selected.permissions.includes(permission)) ||
      accounts.some(
        (account) => account.roles.includes(selected.name) !== draftMemberIds.has(account.id),
      ));

  const togglePermission = (form: typeof creating) => (permission: GrantedPermission) => {
    const held = form.values.permissions;

    form.set(
      'permissions',
      held.includes(permission)
        ? held.filter((candidate) => candidate !== permission)
        : [...held, permission],
    );
  };

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
        header: say('common.role'),
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
                  ? say('common.everything')
                  : sayCount('common.count.permissions', row.original.permissions.length)}
              </span>
            </span>
          </span>
        ),
      },
      {
        id: 'position',
        header: say('screens.adminArea.rolesPanel.rank'),
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
              label={say('common.actionsForName', { name: row.original.name })}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'edit',
                      label: say('screens.adminArea.rolesPanel.editRole'),
                      icon: <Icon of={PenLineFilledIcon} size={15} />,
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
                      label: say('screens.adminArea.rolesPanel.deleteRole'),
                      icon: <Icon of={BinFilledIcon} size={15} />,
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
          <Icon of={TriangleAlertIcon} size={18} tone="danger" className="mt-0.5 shrink-0" />
          {refusal.message}
        </p>
      )}

      <PanelCard
        title={say('common.roles')}
        isFlush
        actions={
          <PanelCardAction
            icon={PlusFilledIcon}
            onClick={() => {
              setIsCreating(true);
            }}
          >
            {say('screens.adminArea.rolesPanel.createRole')}
          </PanelCardAction>
        }
      >
        {couldNotRead ? (
          <CouldNotRead
            said={say('screens.adminArea.rolesPanel.theRolesCouldNotBeRead')}
            isTryingAgain={askedRoles.isFetching || askedCatalogue.isFetching}
            onTryAgain={() => {
              void askedRoles.refetch();
              void askedCatalogue.refetch();
            }}
          />
        ) : (
          <DataTable
            label={say('common.roles')}
            columns={columns}
            rows={roles}
            height="fills"
            emptyMessage={say('screens.adminArea.rolesPanel.noRolesYet')}
          />
        )}
      </PanelCard>

      <DialogCompanion
        label={say('screens.adminArea.rolesPanel.createARole')}
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
        }}
      >
        <DialogTitle
          size="compact"
          title={say('screens.adminArea.rolesPanel.createARole')}
          detail={say('screens.adminArea.rolesPanel.aRoleIsANameAnd')}
        />

        <Form
          label={say('screens.adminArea.rolesPanel.createARole')}
          onSubmit={creating.submit}
          isDialog
        >
          <DialogContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start gap-3">
              <TextField
                label={say('common.name')}
                {...creating.text('name')}
                placeholder={say('screens.adminArea.rolesPanel.housemate')}
                className="min-w-48 flex-1"
              />

              <TextField
                label={say('screens.adminArea.rolesPanel.rank')}
                type="number"
                min={0}
                {...creating.text('position')}
                className="w-24 shrink-0"
              />
            </div>

            <FormField
              label={say('common.colour')}
              description={say('screens.adminArea.rolesPanel.shownWhereverSomebodyHoldingThisRole')}
            >
              <ColorSwatchPicker
                value={creating.values.color}
                onChange={(next) => {
                  creating.set('color', next);
                }}
              />
            </FormField>

            <PermissionEditor
              catalogue={catalogue}
              {...(pluginNodes === undefined ? {} : { pluginNodes })}
              selected={creating.values.permissions}
              onToggle={togglePermission(creating)}
            />
          </DialogContent>

          <DialogFooter
            note={creating.problem}
            dismiss={{
              onChoose: () => {
                setIsCreating(false);
              },
            }}
            confirm={{
              label: say('screens.adminArea.rolesPanel.createRole'),
              isSubmit: true,
              isLoading: creating.isSubmitting,
            }}
          />
        </Form>
      </DialogCompanion>

      <ConfirmDialog
        title={say('screens.adminArea.rolesPanel.deleteThisRole')}
        detail={
          deleting === null
            ? ''
            : say('screens.adminArea.rolesPanel.nameWillBeRemovedAndAnybody', {
                name: deleting.name,
              })
        }
        confirmLabel={say('screens.adminArea.rolesPanel.deleteRole')}
        isDestructive
        isOpen={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          const role = deleting;

          setDeleting(null);

          if (role !== null) {
            void act(
              () => deleteRole(role.id),
              say('screens.adminArea.rolesPanel.deletedTheNameRole', { name: role.name }),
            );
          }
        }}
      />

      <DialogCompanion
        label={
          selected === null
            ? say('screens.adminArea.rolesPanel.editRole')
            : say('common.editName', { name: selected.name })
        }
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
              title={say('common.editName', { name: selected.name })}
              detail={say('screens.adminArea.rolesPanel.aHigherRankManagesALower')}
              below={
                <TabRow
                  label={say('screens.adminArea.rolesPanel.whatToChangeAboutThisRole')}
                  tone="underlined"
                  size="sm"
                  value={editTab}
                  groups={[
                    {
                      items: [
                        { id: 'display', label: say('common.display') },
                        {
                          id: 'permissions',
                          label: say('screens.adminArea.rolesPanel.permissions'),
                        },
                        {
                          id: 'members',
                          label: say('screens.adminArea.rolesPanel.manageMembersMemberCount', {
                            memberCount: memberCount.toString(),
                          }),
                        },
                      ],
                    },
                  ]}
                />
              }
            />

            <Form
              label={say('screens.adminArea.rolesPanel.editRole')}
              onSubmit={(event) => {
                if (
                  editing.errorOf('name') !== undefined ||
                  editing.errorOf('position') !== undefined
                ) {
                  setEditTab('display');
                }

                editing.submit(event);
              }}
              isDialog
            >
              <DialogContent className="flex min-h-[28rem] max-h-[32rem] flex-col gap-5">
                <TabPanel value="display" travel={travel}>
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <TextField
                        label={say('common.name')}
                        {...editing.text('name')}
                        className="min-w-48 flex-1"
                      />

                      <TextField
                        label={say('screens.adminArea.rolesPanel.rank')}
                        type="number"
                        min={0}
                        {...editing.text('position')}
                        className="w-24 shrink-0"
                      />
                    </div>

                    <FormField
                      label={say('common.colour')}
                      description={say(
                        'screens.adminArea.rolesPanel.shownWhereverSomebodyHoldingThisRole',
                      )}
                    >
                      <ColorSwatchPicker
                        value={draft.color}
                        onChange={(next) => {
                          editing.set('color', next);
                        }}
                      />
                    </FormField>
                  </div>
                </TabPanel>

                <TabPanel value="permissions" travel={travel}>
                  <PermissionEditor
                    catalogue={catalogue}
                    {...(pluginNodes === undefined ? {} : { pluginNodes })}
                    selected={draft.permissions}
                    onToggle={togglePermission(editing)}
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
                note={editing.problem}
                dismiss={{
                  label: say('common.close'),
                  onChoose: () => {
                    setSelectedRoleId(null);
                  },
                }}
                confirm={{
                  label: say('common.saveChanges'),
                  isSubmit: true,
                  isLoading: editing.isSubmitting,
                  isDisabled: !hasUnsavedChanges,
                }}
              />
            </Form>
          </Tabs>
        )}
      </DialogCompanion>
    </div>
  );
};

RolesPanel.displayName = 'RolesPanel';

export { RolesPanel };
