import { Check as CheckIcon } from '@keyline-icons/react';
import { Info as InfoIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { Tooltip } from '@ValenceUI/Tooltip';
import { MENU } from '@ValenceUI/tokens/menu';
import type { MenuItemFaceProps } from './MenuItemFace.types';

/**
 * What one item in a menu shows, the same in a menu opened from a button and one opened by a right
 * click: its icon, what it does, a note at the end, a tick where it is the one in force, and a mark
 * that explains it when pointed at.
 *
 * @param item - The item.
 */
const MenuItemFace = ({ item }: MenuItemFaceProps) => (
  <>
    {item.icon === undefined ? null : <span className={MENU.icon}>{item.icon}</span>}

    <span className={MENU.itemLabel}>{item.label}</span>

    {item.detail === undefined ? null : <span className={MENU.detail}>{item.detail}</span>}

    {item.isCurrent === true ? (
      <span className={MENU.hint}>
        <Icon of={CheckIcon} size={15} />
      </span>
    ) : null}

    {item.hint === undefined ? null : (
      <Tooltip label={item.hint} side="left">
        <span data-slot="menu-hint" className={MENU.hint}>
          <Icon of={InfoIcon} size={15} />
        </span>
      </Tooltip>
    )}
  </>
);

MenuItemFace.displayName = 'MenuItemFace';

export { MenuItemFace };
