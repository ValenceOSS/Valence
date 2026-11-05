import { useState } from 'react';
import { User as UserIcon } from '@keyline-icons/react';
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  ChevronsUp as ChevronsUpIcon,
  X as XIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import type { CastRowProps } from './CastRow.types';
import { say } from '@ValenceI18n/say';

/**
 * One person in a title's cast on its People tab: their picture and name, the part they play,
 * saved once typing stops, and ways to move them up or down the billing or take them off.
 *
 * @param member - The person and their part.
 * @param onRole - Told the part changed.
 * @param onMoveToTop - Moves them to the top of the billing, where they are not there already.
 * @param onMoveUp - Moves them one place earlier, where there is a place.
 * @param onMoveDown - Moves them one place later, where there is a place.
 * @param onRemove - Takes them off the cast.
 */
const CastRow = ({ member, onRole, onMoveToTop, onMoveUp, onMoveDown, onRemove }: CastRowProps) => {
  const [role, setRole] = useState(member.role);
  const settle = () => {
    if (role.trim() !== member.role) {
      onRole(role.trim());
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 py-2 @xl:flex-nowrap">
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised text-text-muted">
        {member.imageUrl === null ? (
          <Icon of={UserIcon} size={18} />
        ) : (
          <img src={member.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate font-body text-sm font-medium text-text @xl:max-w-64">
        {member.name}
      </span>
      <TextField
        label={say('screens.adminArea.titlePeople.roleOfName', { name: member.name })}
        isLabelHidden
        size="sm"
        placeholder={say('common.role')}
        value={role}
        onValueChange={setRole}
        onBlur={settle}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            settle();
          }
        }}
        className="min-w-40 flex-1"
      />
      <span className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.adminArea.titlePeople.moveNameToTheTop', { name: member.name })}
          disabled={onMoveToTop === undefined}
          {...(onMoveToTop === undefined ? {} : { onClick: onMoveToTop })}
        >
          <Icon of={ChevronsUpIcon} size={15} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.adminArea.titlePeople.moveNameUp', { name: member.name })}
          disabled={onMoveUp === undefined}
          {...(onMoveUp === undefined ? {} : { onClick: onMoveUp })}
        >
          <Icon of={ChevronUpIcon} size={15} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.adminArea.titlePeople.moveNameDown', { name: member.name })}
          disabled={onMoveDown === undefined}
          {...(onMoveDown === undefined ? {} : { onClick: onMoveDown })}
        >
          <Icon of={ChevronDownIcon} size={15} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.adminArea.titlePeople.takeNameOff', { name: member.name })}
          onClick={onRemove}
        >
          <Icon of={XIcon} size={15} />
        </Button>
      </span>
    </li>
  );
};

CastRow.displayName = 'CastRow';

export { CastRow };
