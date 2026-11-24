import { accountHandleOf } from '@ValenceClient/accounts/accountHandleOf';
import { useMemo, useState } from 'react';
import { TextField } from '@ValenceUI/TextField';
import type { Role } from '@ValenceContracts/schemas/Permission';
import { MemberRow } from './components/MemberRow/MemberRow';
import type { RoleMembersProps } from './RoleMembers.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const NO_ROLES: readonly Role[] = [];

const NO_ONE: ReadonlySet<string> = new Set();

/**
 * Who holds a role, and everybody else it could be given to — the same assignment `AccountsPanel`
 * offers from an account's own side, offered here from the role's, for choosing a handful of people
 * for one role rather than one role for each of several people. Those holding it come first, each
 * shows every role it holds, and anybody at or above the reader's own role is shown but cannot be
 * changed. Holds a draft of who is held, applied only when the caller saves.
 *
 * @param accounts - Every account on the server.
 * @param heldIds - The accounts currently held in the draft.
 * @param onToggle - Told which account should flip between held and not.
 * @param roles - Every role, highest first, for naming the roles each account holds.
 * @param roleId - The role being edited, or null for one not made yet.
 * @param outOfReach - The roles at or above the reader's own.
 */
const RoleMembers = ({
  accounts,
  heldIds,
  onToggle,
  roles = NO_ROLES,
  roleId = null,
  outOfReach = NO_ONE,
}: RoleMembersProps) => {
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (query === '') {
      return accounts;
    }

    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        accountHandleOf(account).toLowerCase().includes(query) ||
        (account.email ?? '').toLowerCase().includes(query),
    );
  }, [accounts, search]);

  const rowOf = (account: RoleMembersProps['accounts'][number]) => {
    const held = roles.filter((role) => account.roles.includes(role.name));
    const isHeld = heldIds.has(account.id);
    const heldRoles = roles.filter((role) =>
      role.id === roleId ? isHeld : account.roles.includes(role.name),
    );

    return (
      <MemberRow
        key={account.id}
        account={account}
        isHeld={isHeld}
        heldRoles={heldRoles}
        isLocked={held.some((role) => outOfReach.has(role.id))}
        onToggle={() => {
          onToggle(account.id);
        }}
      />
    );
  };

  const members = shown.filter((account) => heldIds.has(account.id));
  const everyoneElse = shown.filter((account) => !heldIds.has(account.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pt-4 pb-4">
        <TextField
          label={say('common.findSomebody')}
          isLabelHidden
          type="search"
          value={search}
          onValueChange={setSearch}
          placeholder={say('common.findSomebody')}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5">
        {shown.length === 0 ? (
          <p className="text-sm text-text-muted">{say('common.nobodyHereMatchesThat')}</p>
        ) : null}

        {[
          {
            id: 'members',
            heading: sayCount('screens.adminArea.rolesPanel.memberCount', heldIds.size),
            accounts: members,
          },
          {
            id: 'everyoneElse',
            heading: say('screens.rolesPanel.roleMembers.everyoneElse'),
            accounts: everyoneElse,
          },
        ].map((group) =>
          group.accounts.length === 0 ? null : (
            <section key={group.id} className="flex flex-col gap-2">
              <h4 className="px-1 text-sm font-medium text-text-muted">{group.heading}</h4>

              <ul className="flex flex-col divide-y divide-[var(--surface-line)] rounded-xl bg-[var(--surface-hover)] ring-1 ring-inset ring-[var(--surface-line)]">
                {group.accounts.map(rowOf)}
              </ul>
            </section>
          ),
        )}
      </div>
    </div>
  );
};

RoleMembers.displayName = 'RoleMembers';

export { RoleMembers };
