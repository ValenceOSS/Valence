import { Info as InfoIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import type { PanelCardInfoProps } from './PanelCardInfo.types';

/**
 * The small "i" that says what something is when pointed at or focused — in a card's corner, beside a
 * row's name or after a status — so what it explains can get straight to the point rather than
 * opening on a paragraph. Every "i" in the application is this one, so they all look and behave alike.
 *
 * @param label - What the button is called, read out to anybody who cannot see it.
 * @param detail - What the card is for.
 * @param isList - Whether the detail is a list of facts, laid out as the hover card lays out a
 *   list, rather than a paragraph.
 * @param side - Which side of the button the detail opens on, below it unless told otherwise.
 * @param align - Which edge of the button the detail lines up with, its far edge unless told otherwise.
 */
const PanelCardInfo = ({
  label,
  detail,
  isList = false,
  side = 'bottom',
  align = 'end',
}: PanelCardInfoProps) => (
  <HoverCard
    side={side}
    align={align}
    {...(isList
      ? { isList: true, detail }
      : { detail: <div className="max-w-72 text-xs leading-relaxed normal-case">{detail}</div> })}
  >
    <Button variant="subtle" size="xs" isIconOnly label={label} hasTooltip={false}>
      <Icon of={InfoIcon} size={15} className="opacity-60" />
    </Button>
  </HoverCard>
);

PanelCardInfo.displayName = 'PanelCardInfo';

export { PanelCardInfo };
