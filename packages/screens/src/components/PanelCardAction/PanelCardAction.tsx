import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { PanelCardActionProps } from './PanelCardAction.types';

/**
 * A control in the corner of a card: transparent, small, and the words first with their icon after
 * them. Every card's actions are this, so no card draws its own.
 *
 * @param children - What the control says.
 * @param icon - The icon drawn after the words.
 * @param onClick - Called when it is pressed.
 * @param isLoading - Whether the work it started is still under way.
 * @param isDisabled - Whether it cannot be pressed.
 */
const PanelCardAction = ({
  children,
  icon,
  onClick,
  isLoading = false,
  isDisabled = false,
}: PanelCardActionProps) => (
  <Button variant="ghost" size="xs" isLoading={isLoading} disabled={isDisabled} onClick={onClick}>
    {children}
    <Icon of={icon} size={14} />
  </Button>
);

PanelCardAction.displayName = 'PanelCardAction';

export { PanelCardAction };
