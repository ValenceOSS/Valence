import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { RowFoldButtonProps } from './RowFoldButton.types';

/**
 * The chevron at the start of a table row with rows beneath it, turning down while they show.
 *
 * @param label - What pressing it does, for whoever cannot see the chevron.
 * @param isOpen - Whether the rows beneath are showing.
 * @param onToggle - Called to open or fold the rows beneath.
 */
const RowFoldButton = ({ label, isOpen, onToggle }: RowFoldButtonProps) => (
  <Button
    variant="subtle"
    size="none"
    isIconOnly
    label={label}
    aria-expanded={isOpen}
    onClick={onToggle}
    className="size-6 shrink-0"
  >
    <Icon
      of={ChevronRightIcon}
      size={15}
      className={cn(
        'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]',
        'motion-reduce:transition-none',
        isOpen ? 'rotate-90' : '',
      )}
    />
  </Button>
);

RowFoldButton.displayName = 'RowFoldButton';

export { RowFoldButton };
