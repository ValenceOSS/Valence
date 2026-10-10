import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Icon } from '@ValenceUI/Icon';
import type { PanelCardMenuProps } from './PanelCardMenu.types';
import { say } from '@ValenceI18n/say';

/**
 * The things that can be done to a whole card, gathered behind one control in its corner that says
 * Actions in words, drawn as the card's other actions are. A row of a table opens its menu from three
 * dots; a card says what its menu is, so the two never read as the same kind of control.
 *
 * @param label - What the menu acts on, read out to anybody who cannot see it.
 * @param groups - The actions, grouped as the menu should show them.
 * @param isSegment - Whether it is one part of a joined row of controls rather than standing alone.
 */
const PanelCardMenu = ({ label, groups, isSegment = false }: PanelCardMenuProps) => (
  <ActionMenu
    label={label}
    look={isSegment ? 'segment' : 'labelled'}
    align="end"
    trigger={
      <>
        {say('common.actions')}
        <Icon of={ChevronDownIcon} size={14} />
      </>
    }
    groups={groups}
  />
);

PanelCardMenu.displayName = 'PanelCardMenu';

export { PanelCardMenu };
