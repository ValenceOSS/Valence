import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { Icon } from '@ValenceUI/Icon';
import {
  ShieldUser as ShieldUserFilledIcon,
  Users as UsersFilledIcon,
} from '@keyline-icons/react/fill';
import type { RoleFaceProps } from './RoleFace.types';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * The face of one role in the list: its colour, its name and how many hold it, chosen by pressing it.
 *
 * @param name - What the role is called.
 * @param color - Its colour, or null for none.
 * @param grantsEverything - Whether it holds every permission, which it wears a shield for.
 * @param memberCount - How many hold it, or null for a role not saved yet.
 * @param isChosen - Whether it is the one open beside the list.
 * @param lead - What sits before the colour: a grip for a role that moves, a lock for one that cannot.
 * @param menu - What can be done to it, at the row's far end.
 * @param onChoose - Told when it is pressed.
 */
const RoleFace = ({
  name,
  color,
  grantsEverything,
  memberCount,
  isChosen,
  lead,
  menu,
  onChoose,
}: RoleFaceProps) => (
  <div
    className={cn(
      'group/role flex h-14 items-center gap-1 rounded-lg pe-1.5 transition-colors duration-[var(--duration-fast)]',
      isChosen ? 'bg-[var(--surface-active)]' : 'hover:bg-[var(--surface-hover)]',
    )}
  >
    <Button
      variant="bare"
      size="none"
      aria-current={isChosen ? 'true' : undefined}
      onClick={onChoose}
      className="flex h-full min-w-0 flex-1 items-center gap-2.5 ps-1.5 text-start"
    >
      <span className="flex w-4 shrink-0 justify-center">{lead}</span>

      <span
        aria-hidden
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          color === null ? 'bg-[var(--surface-active)] text-text-muted' : '',
        )}
        style={
          color === null
            ? {}
            : { backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)`, color }
        }
      >
        <Icon
          of={grantsEverything ? ShieldUserFilledIcon : UsersFilledIcon}
          size={16}
          tone="inherit"
        />
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-text">{name}</span>
        {memberCount === null ? null : (
          <span className="truncate text-xs text-text-muted">
            {sayCount('screens.adminArea.rolesPanel.memberCount', memberCount)}
          </span>
        )}
      </span>
    </Button>

    {menu}
  </div>
);

RoleFace.displayName = 'RoleFace';

export { RoleFace };
