import {
  PanelLeft as PanelLeftIcon,
  PanelLeftClose as PanelLeftCloseIcon,
  PanelLeftCloseDashed as PanelLeftCloseDashedIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
  PanelLeftOpenDashed as PanelLeftOpenDashedIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { SidebarToggleProps } from './SidebarToggle.types';

const FADES =
  'absolute inset-0 m-auto transition-[opacity,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none';

/**
 * Folds a sidebar away or brings it back, saying which before it is pressed: the panel at rest, the
 * panel with an arrow pointing the way it will go when the pointer is over it, and the panel drawn
 * dashed while it is held, as the sidebar is about to be gone or about to be there.
 *
 * @param isOpen - Whether the sidebar is showing, so the arrow points to close it rather than open it.
 * @param label - What pressing it does, read out and shown on hover.
 * @param onToggle - Told when it is pressed.
 */
const SidebarToggle = ({ isOpen, label, onToggle }: SidebarToggleProps) => (
  <Button
    variant="ghost"
    size="sm"
    isIconOnly
    label={label}
    onClick={onToggle}
    className="group/toggle relative"
  >
    <Icon
      of={PanelLeftIcon}
      size={17}
      className={cn(FADES, 'group-hover/toggle:scale-90 group-hover/toggle:opacity-0')}
    />
    <Icon
      of={isOpen ? PanelLeftCloseIcon : PanelLeftOpenIcon}
      size={17}
      className={cn(
        FADES,
        'scale-90 opacity-0 group-hover/toggle:scale-100 group-hover/toggle:opacity-100',
        'group-active/toggle:opacity-0',
      )}
    />
    <Icon
      of={isOpen ? PanelLeftCloseDashedIcon : PanelLeftOpenDashedIcon}
      size={17}
      className={cn(FADES, 'opacity-0 group-active/toggle:opacity-100')}
    />
  </Button>
);

SidebarToggle.displayName = 'SidebarToggle';

export { SidebarToggle };
