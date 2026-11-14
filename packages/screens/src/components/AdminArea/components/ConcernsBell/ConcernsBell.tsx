import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell as BellIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { Badge } from '@ValenceUI/Badge';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { ADMIN_NOTICES } from '@ValenceScreens/components/AdminPage/ADMIN_NOTICES';
import { useBarSlot } from '@ValenceScreens/components/AdminPage/useBarSlot';
import { ConcernList } from '@ValenceScreens/components/AdminArea/components/ConcernList/ConcernList';
import type { ConcernsBellProps } from './ConcernsBell.types';
import { say } from '@ValenceI18n/say';

const COUNTED_UP_TO = 9;

/**
 * A bell in the bar along the top of the admin area, counting what needs a person, with the list of
 * it behind it. Opening a concern's panel closes the list.
 *
 * @param concerns - What is wrong, worst first.
 * @param onOpenPanel - Called with the panel a concern is dealt with in, and what to narrow it to
 *   where the concern says.
 * @param onDismiss - Called with a concern somebody dismissed.
 */
const ConcernsBell = ({ concerns, onOpenPanel, onDismiss }: ConcernsBellProps) => {
  const slot = useBarSlot(ADMIN_NOTICES);
  const [isOpen, setOpen] = useState(false);

  if (slot === null) {
    return null;
  }

  return createPortal(
    <PopoverPanel
      label={say('common.needsAttention')}
      heading={say('common.needsAttention')}
      side="bottom"
      align="end"
      triggerLook="icon"
      isOpen={isOpen}
      onOpenChange={setOpen}
      className="w-[26rem] max-w-[calc(100vw-2rem)]"
      trigger={
        <span className="relative flex size-8 items-center justify-center">
          <Icon of={BellIcon} size={17} />

          {concerns.length === 0 ? null : (
            <Badge
              tone="bright"
              size="count"
              className="absolute -top-0.5 -end-0.5 ring-2 ring-[var(--frame-panel)]"
            >
              <FormattedNumber
                value={Math.min(concerns.length, COUNTED_UP_TO)}
                {...(concerns.length > COUNTED_UP_TO ? { suffix: '+' } : {})}
              />
            </Badge>
          )}
        </span>
      }
    >
      {concerns.length === 0 ? (
        <p className="px-1 pb-1 text-sm text-text-muted">
          {say('screens.adminArea.concernsBell.allClear')}
        </p>
      ) : (
        <ConcernList
          concerns={concerns}
          onOpenPanel={(panel, search) => {
            setOpen(false);
            onOpenPanel(panel, search);
          }}
          onDismiss={onDismiss}
        />
      )}
    </PopoverPanel>,
    slot,
  );
};

ConcernsBell.displayName = 'ConcernsBell';

export { ConcernsBell };
