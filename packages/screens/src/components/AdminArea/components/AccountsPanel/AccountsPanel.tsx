import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountsPanel/components/AccountFace/AccountFace';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Icon } from '@ValenceUI/Icon';
import {
  Add01Icon,
  Alert02Icon,
  CancelCircleIcon,
  Delete02Icon,
  MoreHorizontalIcon,
  UnfoldMoreIcon,
  UserSettings01Icon,
} from '@hugeicons/core-free-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { FormField } from '@ValenceUI/FormField';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Switch } from '@ValenceUI/Switch';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { assignRole, removeRole } from '@ValenceClient/admin/fetchRoles';
import {
  banAccount,
  editAccount,
  inviteAccount,
  removeAccount,
  resetAccountPassword,
  setAccountAvatar,
  setAccountPhoto,
  unbanAccount,
} from '@ValenceClient/admin/fetchAccounts';
import { endAccountSessions } from '@ValenceClient/admin/fetchAccountSessions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { AccountAvatarPicker } from './components/AccountAvatarPicker/AccountAvatarPicker';
import { AccountDevices } from './components/AccountDevices/AccountDevices';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { Refusal } from '@ValenceClient/admin/fetchRoles';
import type { Role } from '@ValenceContracts/schemas/Permission';
import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';
import type { Avatar } from '@ValenceContracts/schemas/ViewerProfile';
import type { AccountAvatarDraft } from './components/AccountAvatarPicker/AccountAvatarPicker.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { setCeiling, setLibraryAccess } from '@ValenceClient/admin/fetchLibraryAccess';
import { describeCeiling } from '@ValenceContracts/schemas/LibraryAccess';
import { AGE_CHOICES } from '@ValenceScreens/components/AdminArea/ageChoices';

type Asked = { kind: 'ban' | 'remove'; account: Account };

const NO_ACCOUNTS: Account[] = [];

const NO_ROLES: Role[] = [];

const NO_SHELVES: LibraryReach[] = [];

const EDIT_TABS = ['display', 'security', 'devices', 'roles', 'libraries'] as const;

type EditTab = (typeof EDIT_TABS)[number];

/**
 * Whether a string the tab row handed back actually names one of the edit dialog's tabs.
 *
 * @param value - What was chosen.
 * @returns Whether it names a tab.
 */
const isEditTab = (value: string): value is EditTab => EDIT_TABS.some((tab) => tab === value);

/**
 * Whether two avatars describe the same picture, since they are objects rather than a single value a
 * draft can be compared against with `!==`.
 *
 * @param first - One avatar.
 * @param second - The other.
 * @returns Whether they describe the same thing.
 */
const avatarsEqual = (first: Avatar, second: Avatar): boolean => {
  if (first.kind !== second.kind) {
    return false;
  }

  if (first.kind === 'drawn' && second.kind === 'drawn') {
    return first.style === second.style && first.seed === second.seed;
  }

  if (first.kind === 'photo' && second.kind === 'photo') {
    return first.isVideo === second.isVideo;
  }

  return true;
};

/**
 * Who is on this server and everything about their account: their name and address, their roles, the
 * libraries they may see, their picture, their password, and where they are signed in. Permissions
 * live on roles now rather than one account at a time, so this dialog no longer offers exceptions —
 * a role covers that well enough that a second, per-account system for the same thing was only ever
 * more to get wrong.
 */
const AccountsPanel = () => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<EditTab>('display');
  const [refusal, setRefusal] = useState<Refusal>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [search, setSearch] = useState('');
  const [asking, setAsking] = useState<Asked | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftRoleIds, setDraftRoleIds] = useState<ReadonlySet<string>>(new Set());
  const [draftLibraryAccess, setDraftLibraryAccess] = useState<LibraryReach[]>([]);
  const [draftFace, setDraftFace] = useState<AccountAvatarDraft>({
    avatar: { kind: 'initial' },
    colour: PROFILE_COLOURS[0],
    photo: null,
  });
  const [draftPassword, setDraftPassword] = useState('');
  const [confirmingPasswordReset, setConfirmingPasswordReset] = useState(false);
  const [confirmingSignOutEverywhere, setConfirmingSignOutEverywhere] = useState(false);

  const { may } = useWhatIMayDo();
  const maySecureAccounts = may('account.security');

  const cache = useQueryClient();

  const askedAccounts = useQuery(adminQueries.accounts());
  const askedRoles = useQuery(adminQueries.roles());

  const accounts = askedAccounts.data ?? NO_ACCOUNTS;
  const roles = askedRoles.data ?? NO_ROLES;
  const held = useQuery(adminQueries.accountPermissions(accountId)).data ?? null;
  const shelves = useQuery(adminQueries.libraryAccess(accountId)).data ?? NO_SHELVES;

  const picked = accounts.find((account) => account.id === accountId) ?? null;

  const reload = useCallback(async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: adminQueries.accounts().queryKey }),
      cache.invalidateQueries({ queryKey: adminQueries.accountPermissions(accountId).queryKey }),
      cache.invalidateQueries({ queryKey: adminQueries.libraryAccess(accountId).queryKey }),
    ]);
  }, [cache, accountId]);

  const act = useCallback(
    async (run: () => Promise<Refusal>) => {
      const outcome = await run();

      setRefusal(outcome);

      if (outcome === null) {
        await reload();
      }
    },
    [reload],
  );

  useEffect(() => {
    setDraftName(picked?.name ?? '');
    setDraftEmail(picked?.email ?? '');
    setDraftFace({
      avatar: picked?.face?.avatar ?? { kind: 'initial' },
      colour: picked?.face?.colour ?? PROFILE_COLOURS[0],
      photo: null,
    });
  }, [picked]);

  useEffect(() => {
    setDraftRoleIds(new Set((held?.roles ?? []).map((role) => role.id)));
  }, [accountId, held]);

  useEffect(() => {
    setDraftLibraryAccess(shelves);
  }, [accountId, shelves]);

  const travel = useTravelDirection([...EDIT_TABS], editTab);

  const currentRoleIds = new Set((held?.roles ?? []).map((role) => role.id));

  const hasUnsavedChanges =
    picked !== null &&
    (draftName !== picked.name ||
      draftEmail !== picked.email ||
      draftFace.photo !== null ||
      !avatarsEqual(draftFace.avatar, picked.face?.avatar ?? { kind: 'initial' }) ||
      draftFace.colour !== (picked.face?.colour ?? PROFILE_COLOURS[0]) ||
      draftRoleIds.size !== currentRoleIds.size ||
      [...draftRoleIds].some((id) => !currentRoleIds.has(id)) ||
      draftLibraryAccess.some((shelf) => {
        const original = shelves.find((candidate) => candidate.id === shelf.id);

        return (
          original === undefined ||
          original.mayView !== shelf.mayView ||
          original.maximumAge !== shelf.maximumAge ||
          original.allowsUnrated !== shelf.allowsUnrated
        );
      }));

  const saveChanges = useCallback(async () => {
    if (picked === null || accountId === null) {
      return;
    }

    const patch: { name?: string; email?: string } = {};

    if (draftName !== picked.name) {
      patch.name = draftName;
    }

    if (draftEmail !== picked.email) {
      patch.email = draftEmail;
    }

    if (Object.keys(patch).length > 0) {
      const outcome = await editAccount(accountId, patch);

      if (outcome !== null) {
        setRefusal(outcome);
        return;
      }
    }

    for (const roleId of draftRoleIds) {
      if (currentRoleIds.has(roleId)) {
        continue;
      }

      const outcome = await assignRole(accountId, roleId);

      if (outcome !== null) {
        setRefusal(outcome);
        return;
      }
    }

    for (const roleId of currentRoleIds) {
      if (draftRoleIds.has(roleId)) {
        continue;
      }

      const outcome = await removeRole(accountId, roleId);

      if (outcome !== null) {
        setRefusal(outcome);
        return;
      }
    }

    for (const shelf of draftLibraryAccess) {
      const original = shelves.find((candidate) => candidate.id === shelf.id);

      if (original === undefined) {
        continue;
      }

      if (original.mayView !== shelf.mayView) {
        const outcome = await setLibraryAccess(accountId, shelf.id, shelf.mayView);

        if (outcome !== null) {
          setRefusal(outcome);
          return;
        }
      }

      if (
        shelf.mayView &&
        (original.maximumAge !== shelf.maximumAge || original.allowsUnrated !== shelf.allowsUnrated)
      ) {
        const outcome = await setCeiling(
          accountId,
          shelf.id,
          shelf.maximumAge === null
            ? null
            : { maximumAge: shelf.maximumAge, allowsUnrated: shelf.allowsUnrated },
        );

        if (outcome !== null) {
          setRefusal(outcome);
          return;
        }
      }
    }

    if (draftFace.photo !== null) {
      const outcome = await setAccountPhoto(accountId, draftFace.photo);

      if (outcome !== null) {
        setRefusal(outcome);
        return;
      }
    } else {
      const originalAvatar = picked.face?.avatar ?? { kind: 'initial' as const };
      const originalColour = picked.face?.colour ?? PROFILE_COLOURS[0];
      const avatarChanged = !avatarsEqual(draftFace.avatar, originalAvatar);
      const colourChanged = draftFace.colour !== originalColour;

      if (avatarChanged || colourChanged) {
        const outcome = await setAccountAvatar(accountId, {
          ...(avatarChanged ? { avatar: draftFace.avatar } : {}),
          ...(colourChanged ? { colour: draftFace.colour } : {}),
        });

        if (outcome !== null) {
          setRefusal(outcome);
          return;
        }
      }
    }

    setRefusal(null);
    await reload();
  }, [
    picked,
    accountId,
    draftName,
    draftEmail,
    draftFace,
    draftRoleIds,
    currentRoleIds,
    draftLibraryAccess,
    shelves,
    reload,
  ]);

  const updateShelf = (shelfId: string, changes: Partial<LibraryReach>) => {
    setDraftLibraryAccess((current) =>
      current.map((shelf) => (shelf.id === shelfId ? { ...shelf, ...changes } : shelf)),
    );
  };

  const shown = useMemo(() => {
    const looking = search.trim().toLowerCase();

    return accounts
      .filter(
        (account) =>
          account.name.toLowerCase().includes(looking) ||
          account.email.toLowerCase().includes(looking),
      )
      .sort((first, second) =>
        first.name.localeCompare(second.name, undefined, { sensitivity: 'base' }),
      );
  }, [accounts, search]);

  const roleColours = useMemo(() => new Map(roles.map((role) => [role.name, role.color])), [roles]);

  const columns = useMemo<DataTableColumn<Account>[]>(
    () => [
      {
        id: 'name',
        header: 'Account',
        accessorFn: (account) => account.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-3">
            <AccountFace account={row.original} />

            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <span className="truncate text-xs text-text-muted">
                {row.original.isBanned && row.original.banReason !== null
                  ? `Banned — ${row.original.banReason}`
                  : row.original.email}
              </span>
            </span>
          </span>
        ),
      },
      {
        id: 'roles',
        header: 'Roles',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.roles.length === 0 ? (
            <span className="text-xs text-text-muted">No roles</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              {row.original.roles.map((role) => (
                <Badge key={role} size="sm" colour={roleColours.get(role) ?? null}>
                  {role}
                </Badge>
              ))}
            </span>
          ),
      },
      {
        id: 'state',
        header: 'State',
        accessorFn: (account) => (account.isBanned ? 'Banned' : 'Allowed'),
        cell: ({ row }) =>
          row.original.isBanned ? (
            <Badge size="sm" tone="solid">
              banned
            </Badge>
          ) : (
            <span className="text-xs text-text-muted">Allowed</span>
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
                      id: 'edit',
                      label: 'Edit account',
                      icon: <Icon of={UserSettings01Icon} size={15} />,
                      onChoose: () => {
                        setAccountId(row.original.id);
                        setEditTab('display');
                        setRefusal(null);
                      },
                    },
                    {
                      id: 'ban',
                      label: row.original.isBanned ? 'Let back in' : 'Ban',
                      icon: <Icon of={CancelCircleIcon} size={15} />,
                      onChoose: () => {
                        if (row.original.isBanned) {
                          void act(() => unbanAccount(row.original.id));

                          return;
                        }

                        setAsking({ kind: 'ban', account: row.original });
                      },
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'remove',
                      label: 'Delete account',
                      icon: <Icon of={Delete02Icon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        setAsking({ kind: 'remove', account: row.original });
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
    [act, roleColours],
  );

  const confirm = () => {
    if (asking === null) {
      return;
    }

    const { kind, account } = asking;

    setAsking(null);

    void act(() =>
      kind === 'ban'
        ? banAccount(account.id, 'Banned from the admin area')
        : removeAccount(account.id),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        title={asking?.kind === 'remove' ? 'Delete this account?' : 'Ban this account?'}
        detail={
          asking === null
            ? ''
            : asking.kind === 'remove'
              ? `${asking.account.name} goes, and so does every profile on the account and everything those profiles were watching. Their API keys and share links are revoked at once, so anything using one stops working. Shared playlists stay, marked as a removed profile's. Nothing leaves the library, and this cannot be undone.`
              : `${asking.account.name} will be signed out and refused entry until you let them back in.`
        }
        confirmLabel={asking?.kind === 'remove' ? 'Delete account' : 'Ban'}
        isDestructive
        isOpen={asking !== null}
        onClose={() => {
          setAsking(null);
        }}
        onConfirm={confirm}
      />

      <DialogCompanion
        label="Add user"
        isOpen={isInviting}
        onClose={() => {
          setIsInviting(false);
        }}
      >
        <DialogTitle
          size="compact"
          title="Add user"
          detail="They arrive able to watch and nothing more, until you give them a role."
        />

        <DialogContent className="flex flex-col gap-4">
          <TextField label="Name" value={inviteName} onValueChange={setInviteName} />

          <TextField
            label="Address"
            type="email"
            value={inviteEmail}
            onValueChange={setInviteEmail}
          />

          <TextField
            label="Password"
            type="password"
            value={invitePassword}
            onValueChange={setInvitePassword}
          />

          <p className="text-center font-body text-xs text-text-muted">
            Valence cannot send email, so tell them this password yourself.
          </p>
        </DialogContent>

        <DialogFooter
          dismiss={{
            onChoose: () => {
              setIsInviting(false);
            },
          }}
          confirm={{
            label: 'Add',
            onChoose: () => {
              void act(() =>
                inviteAccount({
                  name: inviteName,
                  email: inviteEmail,
                  password: invitePassword,
                }),
              ).then(() => {
                setInviteName('');
                setInviteEmail('');
                setInvitePassword('');
                setIsInviting(false);
              });
            },
            isDisabled: inviteName === '' || inviteEmail === '' || invitePassword.length < 8,
          }}
        />
      </DialogCompanion>

      {refusal === null || picked !== null ? null : (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-text"
        >
          <Icon of={Alert02Icon} size={18} tone="danger" className="mt-0.5 shrink-0" />
          {refusal.message}
        </p>
      )}

      <PanelCard
        title="Accounts"
        isFlush
        actions={
          <>
            <TextField
              label="Find somebody"
              isLabelHidden
              size="sm"
              type="search"
              placeholder="Find somebody"
              value={search}
              onValueChange={setSearch}
              className="w-56 max-w-full"
            />

            <PanelCardAction
              icon={Add01Icon}
              onClick={() => {
                setIsInviting(true);
              }}
            >
              Add user
            </PanelCardAction>
          </>
        }
      >
        {askedAccounts.isError ? (
          <CouldNotRead
            what="The accounts"
            isTryingAgain={askedAccounts.isFetching}
            onTryAgain={() => {
              void askedAccounts.refetch();
              void askedRoles.refetch();
            }}
          />
        ) : (
          <DataTable
            label="Accounts"
            columns={columns}
            rows={shown}
            pageSize={10}
            height="fill"
            emptyMessage={
              accounts.length === 0 ? 'Nobody has an account yet.' : 'Nobody here matches that.'
            }
          />
        )}
      </PanelCard>

      <DialogCompanion
        label={picked === null ? 'Account' : `Edit ${picked.name}`}
        isOpen={picked !== null && accountId !== null}
        onClose={() => {
          setAccountId(null);
          setRefusal(null);
        }}
      >
        {picked === null || accountId === null ? null : (
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
              title={`Edit ${picked.name}`}
              detail="Changes to their name, picture, roles and libraries apply when you save. Resetting their password and ending sessions happen right away."
              below={
                <TabRow
                  label="What to change about this account"
                  tone="underlined"
                  size="sm"
                  value={editTab}
                  groups={[
                    {
                      items: [
                        { id: 'display', label: 'Display' },
                        { id: 'security', label: 'Security' },
                        { id: 'devices', label: 'Devices' },
                        { id: 'roles', label: 'Roles' },
                        { id: 'libraries', label: 'Libraries' },
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
                  <Icon of={Alert02Icon} size={16} tone="danger" className="mt-0.5 shrink-0" />
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
                      label="Address"
                      type="email"
                      value={draftEmail}
                      onValueChange={setDraftEmail}
                      className="min-w-48 flex-1"
                    />
                  </div>

                  <AccountAvatarPicker
                    accountId={accountId}
                    face={picked.face}
                    draft={draftFace}
                    onDraft={(changes) => {
                      setDraftFace((current) => ({ ...current, ...changes }));
                    }}
                  />
                </div>
              </TabPanel>

              <TabPanel value="security" travel={travel}>
                {!maySecureAccounts ? (
                  <p className="text-sm text-text-muted">
                    You do not hold the permission to reset passwords or end sessions.
                  </p>
                ) : (
                  <div className="flex flex-col gap-6">
                    <FormField
                      label="Reset password"
                      description="Ends every session this account holds. Valence cannot send email, so tell them the new password yourself."
                    >
                      <div className="flex flex-wrap items-end gap-3">
                        <TextField
                          label="New password"
                          type="password"
                          value={draftPassword}
                          onValueChange={setDraftPassword}
                          className="min-w-48 flex-1"
                        />

                        <Button
                          variant="secondary"
                          disabled={draftPassword.length < 8}
                          onClick={() => {
                            setConfirmingPasswordReset(true);
                          }}
                        >
                          Reset password
                        </Button>
                      </div>
                    </FormField>

                    <FormField
                      label="Sign out everywhere"
                      description="Ends every session this account holds, without changing its password."
                    >
                      <Button
                        variant="secondary"
                        className="text-danger hover:text-danger hover:brightness-125"
                        onClick={() => {
                          setConfirmingSignOutEverywhere(true);
                        }}
                      >
                        Sign out everywhere
                      </Button>
                    </FormField>
                  </div>
                )}
              </TabPanel>

              <TabPanel value="devices" travel={travel}>
                <AccountDevices accountId={accountId} />
              </TabPanel>

              <TabPanel value="roles" travel={travel}>
                {roles.length === 0 ? (
                  <p className="text-sm text-text-muted">There are no roles yet.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
                    {roles.map((role) => (
                      <li
                        key={role.id}
                        className="flex items-center justify-between gap-4 py-2.5 first:pt-0"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-full bg-subtle"
                            style={role.color === null ? {} : { backgroundColor: role.color }}
                          />

                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-text">
                              {role.name}
                            </span>
                            <span className="truncate text-xs text-text-muted">
                              {role.permissions.includes('administrator')
                                ? 'Everything'
                                : role.permissions.length === 1
                                  ? '1 permission'
                                  : `${role.permissions.length.toString()} permissions`}
                            </span>
                          </span>
                        </div>

                        <Switch
                          label={`Whether ${picked.name} holds ${role.name}`}
                          isLabelHidden
                          isOn={draftRoleIds.has(role.id)}
                          onToggle={() => {
                            setDraftRoleIds((current) => {
                              const next = new Set(current);

                              if (next.has(role.id)) {
                                next.delete(role.id);
                              } else {
                                next.add(role.id);
                              }

                              return next;
                            });
                          }}
                          className="shrink-0"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TabPanel>

              <TabPanel value="libraries" travel={travel}>
                <FormField
                  label="Libraries"
                  description="What they may see, and how old it may be. Everything, until you say otherwise."
                >
                  {draftLibraryAccess.length === 0 ? (
                    <p className="text-sm text-text-muted">There are no libraries yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {draftLibraryAccess.map((shelf) => (
                        <li key={shelf.id} className="flex flex-wrap items-center gap-2">
                          <Button
                            variant={shelf.mayView ? 'glossy' : 'ghost'}
                            size="sm"
                            aria-pressed={shelf.mayView}
                            label={
                              shelf.mayView
                                ? `Keep ${shelf.name} from ${picked.name}`
                                : `Let ${picked.name} see ${shelf.name}`
                            }
                            onClick={() => {
                              updateShelf(shelf.id, { mayView: !shelf.mayView });
                            }}
                          >
                            {shelf.name}
                          </Button>

                          {!shelf.mayView ? null : (
                            <OptionMenu
                              label={`Age limit in ${shelf.name} for ${picked.name}`}
                              groups={[
                                {
                                  name: 'Nothing above',
                                  selectedId:
                                    shelf.maximumAge === null ? 'none' : String(shelf.maximumAge),
                                  onSelect: (id) => {
                                    updateShelf(shelf.id, {
                                      maximumAge: id === 'none' ? null : Number.parseInt(id, 10),
                                    });
                                  },
                                  options: AGE_CHOICES,
                                },
                              ]}
                              trigger={
                                <>
                                  <span className="truncate">
                                    {describeCeiling(shelf.maximumAge)}
                                  </span>

                                  <Icon of={UnfoldMoreIcon} size={14} className="shrink-0" />
                                </>
                              }
                              triggerShape="field"
                              align="end"
                              className="w-40 max-w-full"
                            />
                          )}

                          {shelf.maximumAge === null ? null : (
                            <Button
                              variant={shelf.allowsUnrated ? 'glossy' : 'ghost'}
                              size="sm"
                              aria-pressed={shelf.allowsUnrated}
                              label={`Allow uncertificated things in ${shelf.name} for ${picked.name}`}
                              onClick={() => {
                                updateShelf(shelf.id, {
                                  allowsUnrated: !shelf.allowsUnrated,
                                  maximumAge: shelf.maximumAge ?? 0,
                                });
                              }}
                            >
                              Allow unrated
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {draftLibraryAccess.length === 0 ||
                  draftLibraryAccess.some((shelf) => shelf.mayView) ? null : (
                    <p className="pt-2 text-xs text-text-muted">
                      They can reach nothing at all, which looks broken rather than restricted to
                      whoever signs in.
                    </p>
                  )}

                  {draftLibraryAccess.every((shelf) => shelf.maximumAge === null) ? null : (
                    <p className="pt-2 text-xs text-text-muted">
                      A limit applies to this account and so to every face on it. If a parent and a
                      child share this one, give the child an account of their own and limit that
                      instead.
                    </p>
                  )}
                </FormField>
              </TabPanel>
            </DialogContent>

            <DialogFooter
              dismiss={{
                label: 'Close',
                onChoose: () => {
                  setAccountId(null);
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

      <ConfirmDialog
        title="Reset this account's password?"
        detail="Every session it holds will be ended, and it will need the new password to sign in again."
        confirmLabel="Reset password"
        isDestructive
        isOpen={confirmingPasswordReset}
        onClose={() => {
          setConfirmingPasswordReset(false);
        }}
        onConfirm={() => {
          const password = draftPassword;

          setConfirmingPasswordReset(false);
          setDraftPassword('');

          if (accountId !== null) {
            void act(() => resetAccountPassword(accountId, password));
          }
        }}
      />

      <ConfirmDialog
        title="Sign this account out everywhere?"
        detail="Every session it holds will be ended. Its password is unchanged."
        confirmLabel="Sign it out"
        isDestructive
        isOpen={confirmingSignOutEverywhere}
        onClose={() => {
          setConfirmingSignOutEverywhere(false);
        }}
        onConfirm={() => {
          setConfirmingSignOutEverywhere(false);

          if (accountId !== null) {
            void act(() => endAccountSessions(accountId));
          }
        }}
      />
    </div>
  );
};

AccountsPanel.displayName = 'AccountsPanel';

export { AccountsPanel };
