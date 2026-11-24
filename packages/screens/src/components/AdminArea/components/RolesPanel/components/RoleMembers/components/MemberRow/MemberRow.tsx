import { accountHandleOf } from '@ValenceClient/accounts/accountHandleOf';
import { Switch } from '@ValenceUI/Switch';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import type { MemberRowProps } from './MemberRow.types';
import { say } from '@ValenceI18n/say';

/**
 * One account in a role's members: its face, name and handle, every role it holds, and a switch giving or taking the role, shut where the account is at or above the
 * reader's own role.
 *
 * @param account - The account.
 * @param isHeld - Whether it holds the role, as the draft stands.
 * @param heldRoles - Every role it holds, highest first.
 * @param isLocked - Whether it is at or above the reader, and so not theirs to change.
 * @param onToggle - Told when the switch is pressed.
 */
const MemberRow = ({ account, isHeld, heldRoles, isLocked, onToggle }: MemberRowProps) => (
  <li className="flex items-center justify-between gap-4 px-4 py-2.5">
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
        <span className="truncate text-xs text-text-muted">
          {isLocked
            ? say('common.handleAndNote', {
                handle: accountHandleOf(account),
                note: say('screens.adminArea.rolesPanel.aboveYourRole'),
              })
            : accountHandleOf(account)}
        </span>
      </span>
    </div>

    <div className="flex min-w-0 items-center gap-3">
      <span className="flex min-w-0 flex-wrap justify-end gap-1.5">
        {heldRoles.map((role) => (
          <span
            key={role.id}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-xs text-text-muted"
          >
            <span
              aria-hidden
              className="size-2 rounded-full ring-1 ring-inset ring-[var(--surface-divider)]"
              style={role.color === null ? {} : { backgroundColor: role.color }}
            />
            {role.name}
          </span>
        ))}
      </span>

      <Switch
        label={say('screens.rolesPanel.roleMembers.whetherNameHoldsThisRole', {
          name: account.name,
        })}
        isLabelHidden
        isOn={isHeld}
        disabled={isLocked}
        onToggle={onToggle}
        className="shrink-0"
      />
    </div>
  </li>
);

MemberRow.displayName = 'MemberRow';

export { MemberRow };
