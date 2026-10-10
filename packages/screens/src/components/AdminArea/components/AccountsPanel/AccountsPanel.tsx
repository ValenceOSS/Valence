import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { Icon } from '@ValenceUI/Icon';
import {
  Bin as BinFilledIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  CircleX as CircleXFilledIcon,
  Copy as CopyIcon,
  Link as LinkFilledIcon,
  Mail as MailFilledIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Plus as PlusFilledIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  TriangleAlert as TriangleAlertIcon,
  UserCheck as UserCheckFilledIcon,
  Users as UsersIcon,
} from '@keyline-icons/react/fill';
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
import { ScopedField } from '@ValenceUI/ScopedField';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { assignRole, removeRole } from '@ValenceClient/admin/fetchRoles';
import {
  banAccount,
  editAccount,
  removeAccount,
  resetAccountPassword,
  setAccountAvatar,
  setAccountPhoto,
  unbanAccount,
} from '@ValenceClient/admin/fetchAccounts';
import { endAccountSessions } from '@ValenceClient/admin/fetchAccountSessions';
import { issueSetupLink } from '@ValenceClient/admin/issueSetupLink';
import { emailSetupLink } from '@ValenceClient/admin/emailSetupLink';
import { revokeSetupLink } from '@ValenceClient/admin/revokeSetupLink';
import { accountHandleOf } from '@ValenceClient/accounts/accountHandleOf';
import { notify } from '@ValenceUI/notify';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { DiscordIdSchema } from '@ValenceContracts/schemas/Account';
import { DEFAULT_SETUP_LINK_LIFETIME } from '@ValenceContracts/schemas/SetupLink';
import type { IssuedSetupLink } from '@ValenceContracts/schemas/SetupLink';
import { accountStandingOf } from './accountStandingOf';
import { AccountStanding } from './components/AccountStanding/AccountStanding';
import { AddAccountDialog } from './components/AddAccountDialog/AddAccountDialog';
import { BanDialog } from './components/BanDialog/BanDialog';
import { SetupLinkSection } from './components/SetupLinkSection/SetupLinkSection';
import { UsernameField } from '@ValenceScreens/components/UsernameField/UsernameField';
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
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';

type Asked = { kind: 'ban' | 'remove'; account: Account };

type Showing = 'everyone' | 'waiting' | 'banned';

const SHOWINGS: readonly Showing[] = ['everyone', 'waiting', 'banned'];

const SKELETON_ROWS = 4;

const NO_LINKS: ReadonlyMap<string, IssuedSetupLink> = new Map();

/**
 * Which part of the list an account belongs in, beyond everyone.
 *
 * @param account - The account.
 * @returns The part, or null for one in ordinary use.
 */
const bucketOf = (account: Account): Showing | null => {
  const standing = accountStandingOf(account);

  if (standing === 'banned') {
    return 'banned';
  }

  return standing === 'active' ? null : 'waiting';
};

const NO_ACCOUNTS: Account[] = [];

const NO_ROLES: Role[] = [];

const NO_SHELVES: LibraryReach[] = [];

const EDIT_TABS = ['profile', 'signIn', 'devices', 'roles', 'libraries'] as const;

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
 * Who is on this server and everything about their account: who is waiting to set theirs up, who is
 * banned and who signed in lately, at a glance; adding somebody with no more than a name and handing
 * them a setup link; and, in the editor, their name, username and address, their setup link and
 * password, where they are signed in, their roles and the libraries they may see.
 *
 * A setup link can only be shown when it is made, since the server keeps no more than a hash of it,
 * so the links made here are held for as long as the page is open and offered again to copy.
 */
const AccountsPanel = () => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<EditTab>('profile');
  const [refusal, setRefusal] = useState<Refusal>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  useAdminCommand('addAccount', () => {
    setIsAddingAccount(true);
  });
  const [search, setSearch] = useState('');
  const [showing, setShowing] = useState<Showing>('everyone');
  const [asking, setAsking] = useState<Asked | null>(null);
  const [held, setHeld] = useState<ReadonlyMap<string, IssuedSetupLink>>(NO_LINKS);
  const [draftName, setDraftName] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftDiscordId, setDraftDiscordId] = useState('');
  const [draftRoleIds, setDraftRoleIds] = useState<ReadonlySet<string>>(new Set());
  const [draftLibraryAccess, setDraftLibraryAccess] = useState<LibraryReach[]>([]);
  const [draftFace, setDraftFace] = useState<AccountAvatarDraft>({
    avatar: { kind: 'initial', font: 'gilroy' },
    colour: PROFILE_COLOURS[0],
    photo: null,
  });
  const [draftPassword, setDraftPassword] = useState('');
  const [confirmingPasswordReset, setConfirmingPasswordReset] = useState(false);
  const [confirmingSignOutEverywhere, setConfirmingSignOutEverywhere] = useState(false);

  const { may } = useWhatIMayDo();
  const maySecureAccounts = may('account.security');

  const cache = useQueryClient();

  const askedAccounts = useQuery(adminQueries.accountList());
  const askedRoles = useQuery(adminQueries.roles());

  const accounts = askedAccounts.data?.accounts ?? NO_ACCOUNTS;
  const canEmailSetupLinks = askedAccounts.data?.canEmailSetupLinks ?? false;
  const roles = askedRoles.data ?? NO_ROLES;
  const heldPermissions = useQuery(adminQueries.accountPermissions(accountId)).data ?? null;
  const shelves = useQuery(adminQueries.libraryAccess(accountId)).data ?? NO_SHELVES;

  const picked = accounts.find((account) => account.id === accountId) ?? null;
  const [now] = useState(() => Date.now());

  const reload = useCallback(async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: adminQueries.accounts().queryKey }),
      cache.invalidateQueries({ queryKey: adminQueries.accountPermissions(accountId).queryKey }),
      cache.invalidateQueries({ queryKey: adminQueries.libraryAccess(accountId).queryKey }),
    ]);
  }, [cache, accountId]);

  const act = useCallback(
    async (run: () => Promise<Refusal>, done: string) => {
      const outcome = await run();

      setRefusal(outcome);
      tellOutcome(done, failureOfRefusal(outcome));

      if (outcome === null) {
        await reload();
      }

      return outcome === null;
    },
    [reload],
  );

  const hold = useCallback((userId: string, link: IssuedSetupLink | null) => {
    setHeld((current) => {
      const next = new Map(current);

      if (link === null) {
        next.delete(userId);
      } else {
        next.set(userId, link);
      }

      return next;
    });
  }, []);

  const openEditor = useCallback((userId: string, tab: EditTab = 'profile') => {
    setAccountId(userId);
    setEditTab(tab);
    setRefusal(null);
  }, []);

  const copyLink = useCallback((link: IssuedSetupLink) => {
    void navigator.clipboard.writeText(link.url).then(
      () => {
        notify.worked(say('screens.adminArea.accountsPanel.copiedTheSetupLink'));
      },
      () => {
        notify.failed(say('screens.adminArea.accountsPanel.theLinkCouldNotBeCopied'));
      },
    );
  }, []);

  const makeLink = useCallback(
    async (account: Account) => {
      const made = await issueSetupLink(account.id, DEFAULT_SETUP_LINK_LIFETIME);

      if (made.kind === 'refused') {
        tellOutcome('', made.refusal?.message ?? null);

        return;
      }

      hold(account.id, made.value);
      openEditor(account.id, 'signIn');
      await reload();
    },
    [hold, openEditor, reload],
  );

  const emailLink = useCallback(
    async (account: Account) => {
      const link = held.get(account.id);
      const sent = await emailSetupLink(
        account.id,
        link === undefined ? { lifetimeDays: DEFAULT_SETUP_LINK_LIFETIME } : { held: link },
      );

      if (sent.kind === 'answered') {
        hold(account.id, sent.value);
      }

      tellOutcome(
        say('screens.addAccountDialog.sentTheLinkToEmail', { email: account.email ?? '' }),
        sent.kind === 'refused' ? (sent.refusal?.message ?? null) : null,
      );
      await reload();
    },
    [held, hold, reload],
  );

  useEffect(() => {
    setDraftName(picked?.name ?? '');
    setDraftUsername(picked?.username ?? '');
    setDraftEmail(picked?.email ?? '');
    setDraftDiscordId(picked?.discordId ?? '');
    setDraftFace({
      avatar: picked?.face?.avatar ?? { kind: 'initial', font: 'gilroy' },
      colour: picked?.face?.colour ?? PROFILE_COLOURS[0],
      photo: null,
    });
  }, [picked]);

  useEffect(() => {
    setDraftRoleIds(new Set((heldPermissions?.roles ?? []).map((role) => role.id)));
  }, [accountId, heldPermissions]);

  useEffect(() => {
    setDraftLibraryAccess(shelves);
  }, [accountId, shelves]);

  const travel = useTravelDirection([...EDIT_TABS], editTab);

  const currentRoleIds = useMemo(
    () => new Set((heldPermissions?.roles ?? []).map((role) => role.id)),
    [heldPermissions?.roles],
  );

  const usernameChange = draftUsername.trim();
  const emailChange = draftEmail.trim();
  const discordIdChange = draftDiscordId.trim();
  const isDiscordIdWellFormed =
    discordIdChange === '' || DiscordIdSchema.safeParse(discordIdChange).success;

  const hasUnsavedChanges =
    picked !== null &&
    (draftName !== picked.name ||
      usernameChange !== (picked.username ?? '') ||
      emailChange !== (picked.email ?? '') ||
      discordIdChange !== (picked.discordId ?? '') ||
      draftFace.photo !== null ||
      !avatarsEqual(draftFace.avatar, picked.face?.avatar ?? { kind: 'initial', font: 'gilroy' }) ||
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

    const patch: {
      name?: string;
      username?: string;
      email?: string | null;
      discordId?: string | null;
    } = {};

    if (draftName !== picked.name) {
      patch.name = draftName;
    }

    if (usernameChange !== '' && usernameChange !== (picked.username ?? '')) {
      patch.username = usernameChange;
    }

    if (emailChange !== (picked.email ?? '')) {
      patch.email = emailChange === '' ? null : emailChange;
    }

    if (isDiscordIdWellFormed && discordIdChange !== (picked.discordId ?? '')) {
      patch.discordId = discordIdChange === '' ? null : discordIdChange;
    }

    if (Object.keys(patch).length > 0) {
      const outcome = await editAccount(accountId, patch);

      if (outcome !== null) {
        setRefusal(outcome);
        tellOutcome('', failureOfRefusal(outcome));
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
        tellOutcome('', failureOfRefusal(outcome));
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
        tellOutcome('', failureOfRefusal(outcome));
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
          tellOutcome('', failureOfRefusal(outcome));
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
          tellOutcome('', failureOfRefusal(outcome));
          return;
        }
      }
    }

    if (draftFace.photo !== null) {
      const outcome = await setAccountPhoto(accountId, draftFace.photo);

      if (outcome !== null) {
        setRefusal(outcome);
        tellOutcome('', failureOfRefusal(outcome));
        return;
      }
    } else {
      const originalAvatar = picked.face?.avatar ?? {
        kind: 'initial' as const,
        font: 'gilroy' as const,
      };
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
          tellOutcome('', failureOfRefusal(outcome));
          return;
        }
      }
    }

    setRefusal(null);
    tellOutcome(say('screens.adminArea.accountsPanel.changesSaved'), null);
    await reload();
  }, [
    picked,
    accountId,
    draftName,
    usernameChange,
    emailChange,
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

  const counts = useMemo(
    () => ({
      everyone: accounts.length,
      waiting: accounts.filter((account) => bucketOf(account) === 'waiting').length,
      banned: accounts.filter((account) => bucketOf(account) === 'banned').length,
    }),
    [accounts],
  );

  const shown = useMemo(() => {
    const looking = search.trim().toLowerCase();

    return accounts
      .filter((account) => showing === 'everyone' || bucketOf(account) === showing)
      .filter(
        (account) =>
          account.name.toLowerCase().includes(looking) ||
          (account.username ?? '').toLowerCase().includes(looking) ||
          (account.email ?? '').toLowerCase().includes(looking),
      )
      .sort((first, second) =>
        first.name.localeCompare(second.name, undefined, { sensitivity: 'base' }),
      );
  }, [accounts, search, showing]);

  const roleColours = useMemo(() => new Map(roles.map((role) => [role.name, role.color])), [roles]);

  const columns = useMemo<DataTableColumn<Account>[]>(
    () => [
      {
        id: 'name',
        header: say('common.account'),
        accessorFn: (account) => account.name,
        cell: ({ row }) => (
          <Button
            variant="bare"
            size="none"
            label={say('common.editName', { name: row.original.name })}
            hasTooltip={false}
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => {
              openEditor(row.original.id);
            }}
          >
            <AccountFace account={row.original} />

            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <span className="truncate text-xs text-text-muted">
                {row.original.email === null || row.original.username === null
                  ? accountHandleOf(row.original)
                  : say('screens.adminArea.accountsPanel.handleAndEmail', {
                      handle: accountHandleOf({ username: row.original.username }),
                      email: row.original.email,
                    })}
              </span>
            </span>
          </Button>
        ),
      },
      {
        id: 'roles',
        header: say('common.roles'),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.roles.length === 0 ? (
            <span className="text-xs text-text-muted">
              {say('screens.adminArea.accountsPanel.noRoles')}
            </span>
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
        header: say('common.state'),
        accessorFn: (account) => accountStandingOf(account),
        cell: ({ row }) => <AccountStanding account={row.original} now={now} />,
      },
      {
        id: 'signedIn',
        header: say('screens.adminArea.accountsPanel.lastSignedIn'),
        accessorFn: (account) => account.lastSignedInAt ?? '',
        cell: ({ row }) => (
          <span className="text-xs text-text-muted">
            {describeSince(row.original.lastSignedInAt, now)}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const account = row.original;
          const link = held.get(account.id) ?? null;
          const standing = accountStandingOf(account);
          const isWaiting =
            standing === 'waiting' || standing === 'expired' || standing === 'cannotSignIn';

          return (
            <span className="flex items-center justify-end gap-1">
              {!isWaiting ? null : link === null ? (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    void makeLink(account);
                  }}
                >
                  {say('screens.setupLinkSection.newLink')}
                  <Icon of={RefreshCwIcon} size={14} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    copyLink(link);
                  }}
                >
                  {say('common.copyLink')}
                  <Icon of={CopyIcon} size={14} />
                </Button>
              )}

              <ActionMenu
                label={say('common.actionsForName', { name: account.name })}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      {
                        id: 'edit',
                        label: say('screens.adminArea.accountsPanel.editAccount'),
                        icon: <Icon of={UserCheckFilledIcon} size={15} />,
                        onChoose: () => {
                          openEditor(account.id);
                        },
                      },
                    ],
                  },
                  {
                    items: [
                      ...(link === null
                        ? []
                        : [
                            {
                              id: 'copy',
                              label: say('common.copyLink'),
                              icon: <Icon of={CopyIcon} size={15} />,
                              onChoose: () => {
                                copyLink(link);
                              },
                            },
                          ]),
                      {
                        id: 'link',
                        label: isWaiting
                          ? say('screens.setupLinkSection.newLink')
                          : say('screens.adminArea.accountsPanel.sendASetupLink'),
                        icon: <Icon of={LinkFilledIcon} size={15} />,
                        onChoose: () => {
                          void makeLink(account);
                        },
                      },
                      ...(!canEmailSetupLinks || account.email === null
                        ? []
                        : [
                            {
                              id: 'email',
                              label: say('screens.setupLinkHandover.sendByEmail'),
                              icon: <Icon of={MailFilledIcon} size={15} />,
                              onChoose: () => {
                                void emailLink(account);
                              },
                            },
                          ]),
                      ...(account.setup.state !== 'waiting'
                        ? []
                        : [
                            {
                              id: 'revoke',
                              label: say('common.withdrawIt'),
                              icon: <Icon of={CircleXFilledIcon} size={15} />,
                              onChoose: () => {
                                hold(account.id, null);
                                void act(
                                  () => revokeSetupLink(account.id),
                                  say('screens.setupLinkSection.theLinkNoLongerWorks'),
                                );
                              },
                            },
                          ]),
                    ],
                  },
                  {
                    items: [
                      {
                        id: 'ban',
                        label: account.isBanned
                          ? say('common.letBackIn')
                          : say('screens.adminArea.accountsPanel.ban'),
                        icon: <Icon of={CircleXFilledIcon} size={15} />,
                        onChoose: () => {
                          if (account.isBanned) {
                            void act(
                              () => unbanAccount(account.id),
                              say('screens.adminArea.accountsPanel.accountUnbanned'),
                            );

                            return;
                          }

                          setAsking({ kind: 'ban', account });
                        },
                      },
                      {
                        id: 'remove',
                        label: say('screens.adminArea.accountsPanel.deleteAccount'),
                        icon: <Icon of={BinFilledIcon} size={15} />,
                        isDestructive: true,
                        onChoose: () => {
                          setAsking({ kind: 'remove', account });
                        },
                      },
                    ],
                  },
                ]}
              />
            </span>
          );
        },
      },
    ],
    [
      act,
      roleColours,
      held,
      now,
      canEmailSetupLinks,
      openEditor,
      makeLink,
      emailLink,
      copyLink,
      hold,
    ],
  );

  const pickedLink = picked === null ? null : (held.get(picked.id) ?? null);

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        title={say('screens.adminArea.accountsPanel.deleteThisAccount')}
        detail={
          asking?.kind === 'remove'
            ? say('screens.adminArea.accountsPanel.nameGoesAndSoDoesEvery', {
                name: asking.account.name,
              })
            : ''
        }
        confirmLabel={say('screens.adminArea.accountsPanel.deleteAccount')}
        isDestructive
        isOpen={asking?.kind === 'remove'}
        onClose={() => {
          setAsking(null);
        }}
        onConfirm={() => {
          if (asking === null) {
            return;
          }

          const { account } = asking;

          setAsking(null);
          void act(
            () => removeAccount(account.id),
            say('common.deletedName', { name: account.name }),
          );
        }}
      />

      <BanDialog
        name={asking?.kind === 'ban' ? asking.account.name : null}
        onClose={() => {
          setAsking(null);
        }}
        onBan={(reason) => {
          if (asking === null) {
            return;
          }

          const { account } = asking;

          setAsking(null);
          void act(
            () => banAccount(account.id, reason),
            say('screens.adminArea.accountsPanel.bannedName', { name: account.name }),
          );
        }}
      />

      <AddAccountDialog
        isOpen={isAddingAccount}
        canEmailSetupLinks={canEmailSetupLinks}
        onClose={() => {
          setIsAddingAccount(false);
        }}
        onAdded={(added) => {
          if (added.setupLink !== null) {
            hold(added.account.id, added.setupLink);
          }

          void reload();
        }}
        onEdit={(userId) => {
          openEditor(userId);
        }}
      />

      {refusal === null || picked !== null ? null : (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-text"
        >
          <Icon of={TriangleAlertIcon} size={18} tone="danger" className="mt-0.5 shrink-0" />
          {refusal.message}
        </p>
      )}

      <PanelCard
        title={say('common.accounts')}
        isFlush
        actions={
          <>
            <ScopedField
              label={say('screens.adminArea.accountsPanel.findSomebodyByNameOrUsername')}
              isLabelHidden
              placeholder={say('common.findSomebody')}
              value={search}
              onValueChange={setSearch}
              choices={[
                {
                  label: say('screens.adminArea.accountsPanel.whoToShow'),
                  options: SHOWINGS.map((one) => ({
                    id: one,
                    label:
                      one === 'everyone'
                        ? say('screens.adminArea.accountsPanel.everyoneCount', {
                            count: counts.everyone,
                          })
                        : one === 'waiting'
                          ? say('screens.adminArea.accountsPanel.waitingForSetupCount', {
                              count: counts.waiting,
                            })
                          : say('screens.adminArea.accountsPanel.bannedCount', {
                              count: counts.banned,
                            }),
                  })),
                  value: showing,
                  onChange: (id) => {
                    const chosen = SHOWINGS.find((one) => one === id);

                    if (chosen !== undefined) {
                      setShowing(chosen);
                    }
                  },
                },
              ]}
              className="w-80 max-w-full"
            />

            <PanelCardAction
              icon={PlusFilledIcon}
              onClick={() => {
                setIsAddingAccount(true);
              }}
            >
              {say('screens.addAccountDialog.addAnAccount')}
            </PanelCardAction>
          </>
        }
      >
        {askedAccounts.isError ? (
          <CouldNotRead
            said={say('screens.adminArea.accountsPanel.theAccountsCouldNotBeRead')}
            isTryingAgain={askedAccounts.isFetching}
            onTryAgain={() => {
              void askedAccounts.refetch();
              void askedRoles.refetch();
            }}
          />
        ) : askedAccounts.isPending ? (
          <div
            className="flex flex-col gap-3 p-5"
            aria-busy
            aria-label={say('screens.adminArea.accountsPanel.readingTheAccounts')}
          >
            {Array.from({ length: SKELETON_ROWS }, (_, at) => (
              <div key={at} className="flex items-center gap-3">
                <Skeleton shape="round" className="size-8" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <NothingHere
            of={UsersIcon}
            title={say('screens.adminArea.accountsPanel.nobodyHasAnAccountYet')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddingAccount(true);
                }}
              >
                <Icon of={PlusIcon} size={15} />
                {say('screens.addAccountDialog.addAnAccount')}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col">
            <DataTable
              label={say('common.accounts')}
              columns={columns}
              rows={shown}
              getRowId={(account) => account.id}
              pageSize={10}
              height="fills"
              emptyMessage={say('common.nobodyHereMatchesThat')}
            />
          </div>
        )}
      </PanelCard>

      <DialogCompanion
        label={
          picked === null ? say('common.account') : say('common.editName', { name: picked.name })
        }
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
              title={say('common.editName', { name: picked.name })}
              detail={<AccountStanding account={picked} now={now} hasDetail={false} />}
              below={
                <TabRow
                  label={say('screens.adminArea.accountsPanel.whatToChangeAboutThisAccount')}
                  tone="underlined"
                  size="sm"
                  value={editTab}
                  groups={[
                    {
                      items: [
                        { id: 'profile', label: say('common.profile') },
                        { id: 'signIn', label: say('screens.adminArea.settingsPanel.signingIn') },
                        { id: 'devices', label: say('common.devices') },
                        { id: 'roles', label: say('common.roles') },
                        { id: 'libraries', label: say('common.libraries') },
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
                  <Icon
                    of={TriangleAlertIcon}
                    size={16}
                    tone="danger"
                    className="mt-0.5 shrink-0"
                  />
                  {refusal.message}
                </p>
              )}

              <TabPanel value="profile" travel={travel}>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <TextField
                      label={say('common.name')}
                      value={draftName}
                      onValueChange={setDraftName}
                      className="min-w-48 flex-1"
                    />

                    <UsernameField
                      value={draftUsername}
                      onValueChange={setDraftUsername}
                      userId={accountId}
                      current={picked.username}
                      className="min-w-48 flex-1"
                    />
                  </div>

                  <TextField
                    label={say('screens.addAccountDialog.emailOptional')}
                    type="email"
                    value={draftEmail}
                    onValueChange={setDraftEmail}
                    description={say('screens.adminArea.accountsPanel.leaveItEmptyForNoAddress')}
                  />

                  <TextField
                    label={say('screens.adminArea.accountsPanel.discordIdOptional')}
                    value={draftDiscordId}
                    onValueChange={setDraftDiscordId}
                    autoComplete="off"
                    {...(isDiscordIdWellFormed
                      ? {
                          description: say(
                            'screens.adminArea.accountsPanel.discordIdMentionedOnRequests',
                          ),
                        }
                      : { error: say('screens.adminArea.accountsPanel.discordIdIsDigits') })}
                  />

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

              <TabPanel value="signIn" travel={travel}>
                <div className="flex flex-col gap-6">
                  <SetupLinkSection
                    account={picked}
                    held={pickedLink}
                    canEmail={canEmailSetupLinks}
                    onHeld={(link) => {
                      hold(picked.id, link);
                    }}
                    onChanged={reload}
                  />

                  {!maySecureAccounts ? (
                    <p className="text-sm text-text-muted">
                      {say('screens.adminArea.accountsPanel.youDoNotHoldThePermission')}
                    </p>
                  ) : (
                    <>
                      <FormField
                        label={say('screens.adminArea.accountsPanel.setAPassword')}
                        description={say(
                          'screens.adminArea.accountsPanel.endsEverySessionThisAccountHolds2',
                        )}
                      >
                        <div className="flex flex-wrap items-end gap-3">
                          <TextField
                            label={say('screens.adminArea.accountsPanel.newPassword')}
                            type="password"
                            value={draftPassword}
                            onValueChange={setDraftPassword}
                            autoComplete="new-password"
                            description={sayCount(
                              'common.atLeastCountCharacters',
                              MINIMUM_PASSWORD_LENGTH,
                            )}
                            className="min-w-48 flex-1"
                          />

                          <Button
                            variant="secondary"
                            disabled={draftPassword.length < MINIMUM_PASSWORD_LENGTH}
                            onClick={() => {
                              setConfirmingPasswordReset(true);
                            }}
                          >
                            {say('screens.resetPasswordPage.setThePassword')}
                          </Button>
                        </div>
                      </FormField>

                      <FormField
                        label={say('screens.adminArea.accountsPanel.signOutEverywhere')}
                        description={say(
                          'screens.adminArea.accountsPanel.endsEverySessionThisAccountHolds',
                        )}
                      >
                        <Button
                          variant="danger"
                          onClick={() => {
                            setConfirmingSignOutEverywhere(true);
                          }}
                        >
                          {say('screens.adminArea.accountsPanel.signOutEverywhere')}
                        </Button>
                      </FormField>
                    </>
                  )}

                  <FormField
                    label={say('screens.adminArea.accountsPanel.ban')}
                    description={
                      picked.isBanned
                        ? say('screens.adminArea.accountsPanel.bannedBanReason', {
                            banReason:
                              picked.banReason ??
                              say('screens.adminArea.accountsPanel.bannedFromTheAdminArea'),
                          })
                        : say('screens.adminArea.accountsPanel.aBanSignsThemOutAndKeepsThemOut')
                    }
                  >
                    <Button
                      variant={picked.isBanned ? 'secondary' : 'danger'}
                      onClick={() => {
                        if (picked.isBanned) {
                          void act(
                            () => unbanAccount(picked.id),
                            say('screens.adminArea.accountsPanel.accountUnbanned'),
                          );

                          return;
                        }

                        setAsking({ kind: 'ban', account: picked });
                      }}
                    >
                      {picked.isBanned
                        ? say('common.letBackIn')
                        : say('screens.adminArea.accountsPanel.ban')}
                    </Button>
                  </FormField>
                </div>
              </TabPanel>

              <TabPanel value="devices" travel={travel}>
                <AccountDevices accountId={accountId} />
              </TabPanel>

              <TabPanel value="roles" travel={travel}>
                {roles.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    {say('screens.adminArea.accountsPanel.thereAreNoRolesYet')}
                  </p>
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
                                ? say('common.everything')
                                : sayCount('common.count.permissions', role.permissions.length)}
                            </span>
                          </span>
                        </div>

                        <Switch
                          label={say('screens.adminArea.accountsPanel.whetherNameHoldsName2', {
                            name: picked.name,
                            name2: role.name,
                          })}
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
                  label={say('common.libraries')}
                  description={say('screens.adminArea.accountsPanel.whatTheyMaySeeAndHow')}
                >
                  {draftLibraryAccess.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      {say('common.thereAreNoLibrariesYet')}
                    </p>
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
                                ? say('screens.adminArea.accountsPanel.keepNameFromName2', {
                                    name: shelf.name,
                                    name2: picked.name,
                                  })
                                : say('screens.adminArea.accountsPanel.letNameSeeName2', {
                                    name: picked.name,
                                    name2: shelf.name,
                                  })
                            }
                            onClick={() => {
                              updateShelf(shelf.id, { mayView: !shelf.mayView });
                            }}
                          >
                            {shelf.name}
                          </Button>

                          {!shelf.mayView ? null : (
                            <OptionMenu
                              label={say('screens.adminArea.accountsPanel.ageLimitInNameForName2', {
                                name: shelf.name,
                                name2: picked.name,
                              })}
                              groups={[
                                {
                                  name: say('common.nothingAbove'),
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

                                  <Icon of={ChevronsUpDownIcon} size={14} className="shrink-0" />
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
                              label={say(
                                'screens.adminArea.accountsPanel.allowUncertificatedThingsInNameFor',
                                { name: shelf.name, name2: picked.name },
                              )}
                              onClick={() => {
                                updateShelf(shelf.id, {
                                  allowsUnrated: !shelf.allowsUnrated,
                                  maximumAge: shelf.maximumAge ?? 0,
                                });
                              }}
                            >
                              {say('common.allowUnrated')}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {draftLibraryAccess.length === 0 ||
                  draftLibraryAccess.some((shelf) => shelf.mayView) ? null : (
                    <p className="pt-2 text-xs text-text-muted">
                      {say('screens.adminArea.accountsPanel.theyCanReachNothingAtAll')}
                    </p>
                  )}

                  {draftLibraryAccess.every((shelf) => shelf.maximumAge === null) ? null : (
                    <p className="pt-2 text-xs text-text-muted">
                      {say('screens.adminArea.accountsPanel.aLimitAppliesToThisAccount')}
                    </p>
                  )}
                </FormField>
              </TabPanel>
            </DialogContent>

            <DialogFooter
              dismiss={{
                label: say('common.close'),
                onChoose: () => {
                  setAccountId(null);
                },
              }}
              confirm={{
                label: say('common.saveChanges'),
                onChoose: () => {
                  void saveChanges();
                },
                isDisabled: draftName.trim() === '' || !hasUnsavedChanges,
              }}
            />
          </Tabs>
        )}
      </DialogCompanion>

      <ConfirmDialog
        title={say('screens.adminArea.accountsPanel.resetThisAccountsPassword')}
        detail={say('screens.adminArea.accountsPanel.everySessionItHoldsWillBe2')}
        confirmLabel={say('screens.adminArea.accountsPanel.resetPassword')}
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
            void act(
              () => resetAccountPassword(accountId, password),
              say('screens.adminArea.accountsPanel.passwordReset'),
            );
          }
        }}
      />

      <ConfirmDialog
        title={say('screens.adminArea.accountsPanel.signThisAccountOutEverywhere')}
        detail={say('screens.adminArea.accountsPanel.everySessionItHoldsWillBe')}
        confirmLabel={say('common.signItOut')}
        isDestructive
        isOpen={confirmingSignOutEverywhere}
        onClose={() => {
          setConfirmingSignOutEverywhere(false);
        }}
        onConfirm={() => {
          setConfirmingSignOutEverywhere(false);

          if (accountId !== null) {
            void act(
              () => endAccountSessions(accountId),
              say('screens.adminArea.accountsPanel.signedThemOutEverywhere'),
            );
          }
        }}
      />
    </div>
  );
};

AccountsPanel.displayName = 'AccountsPanel';

export { AccountsPanel };
