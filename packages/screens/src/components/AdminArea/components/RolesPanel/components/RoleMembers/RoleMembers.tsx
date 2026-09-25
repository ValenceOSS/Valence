import { useMemo, useState } from 'react';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import { say } from '@ValenceI18n/say';
import type { RoleMembersProps } from './RoleMembers.types';

/**
 * Who holds a role, and everybody else it could be given to — the same assignment `AccountsPanel`
 * offers from an account's own side, offered here from the role's, for choosing a handful of people
 * for one role rather than one role for each of several people. Holds a draft of who is held, applied
 * only when the caller saves.
 *
 * @param accounts - Every account on the server.
 * @param heldIds - The accounts currently held in the draft.
 * @param onToggle - Told which account should flip between held and not.
 */
const RoleMembers = ({ accounts, heldIds, onToggle }: RoleMembersProps) => {
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (query === '') {
      return accounts;
    }

    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) || account.email.toLowerCase().includes(query),
    );
  }, [accounts, search]);

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={say('admin.roleMembers.findLabel')}
        isLabelHidden
        type="search"
        value={search}
        onValueChange={setSearch}
        placeholder={say('admin.roleMembers.findLabel')}
        icon={<Icon of={SearchIcon} size={15} />}
      />

      {shown.length === 0 ? (
        <p className="text-sm text-text-muted">{say('admin.roleMembers.nobodyMatches')}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {shown.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                {account.face === null ? (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-text">
                    {(account.name.trim()[0] ?? '?').toUpperCase()}
                  </span>
                ) : (
                  <HouseholdFace
                    household={account.face}
                    accountId={account.id}
                    className="size-8 shrink-0"
                  />
                )}

                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-text">{account.name}</span>
                  <span className="truncate text-xs text-text-muted">{account.email}</span>
                </span>
              </div>

              <Switch
                label={say('admin.roleMembers.holdsLabel', { name: account.name })}
                isLabelHidden
                isOn={heldIds.has(account.id)}
                onToggle={() => {
                  onToggle(account.id);
                }}
                className="shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

RoleMembers.displayName = 'RoleMembers';

export { RoleMembers };
