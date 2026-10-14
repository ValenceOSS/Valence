import { Info as InfoIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import type { PanelCardInfoProps } from './PanelCardInfo.types';

/**
 * The small "i" in a card's corner that says what the card is for when pointed at, so the card
 * itself can get straight to its settings rather than opening on a paragraph.
 *
 * @param label - What the button is called, read out to anybody who cannot see it.
 * @param detail - What the card is for.
 */
const PanelCardInfo = ({ label, detail }: PanelCardInfoProps) => (
  <HoverCard
    side="bottom"
    align="end"
    detail={<div className="max-w-72 text-xs leading-relaxed normal-case">{detail}</div>}
  >
    <Button variant="subtle" size="xs" isIconOnly label={label} hasTooltip={false}>
      <Icon of={InfoIcon} size={15} />
    </Button>
  </HoverCard>
);

PanelCardInfo.displayName = 'PanelCardInfo';

export { PanelCardInfo };
