import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { cn } from '@ValenceUI/cn';
import type { SplitButtonProps } from './SplitButton.types';

/**
 * One large action with a choice of what it acts on behind an arrow at its end: Play, with which
 * edition of a film it plays chosen from the arrow. The two read as one control split by a hairline,
 * so the common case stays a single press and the choice stays out of the way until asked for.
 *
 * @param children - What the main part says.
 * @param onClick - Called when the main part is pressed.
 * @param choiceLabel - What the arrow chooses, read out to anybody who cannot see it.
 * @param choiceName - The heading over the choices.
 * @param options - What can be chosen.
 * @param selectedId - What is chosen now.
 * @param onSelect - Called with what was chosen.
 * @param tone - How loudly it stands.
 * @param className - Extra classes for the caller's own layout.
 */
const SplitButton = ({
  children,
  onClick,
  choiceLabel,
  choiceName,
  options,
  selectedId,
  onSelect,
  tone = 'confirm',
  className,
}: SplitButtonProps) => (
  <div className={cn('inline-flex min-w-0', className)}>
    <Button variant={tone} size="lg" joins="next" className="min-w-0 flex-1" onClick={onClick}>
      {children}
    </Button>

    <OptionMenu
      label={choiceLabel}
      trigger={<Icon of={ChevronDownIcon} size={16} />}
      triggerShape={tone === 'confirm' ? 'confirmJoined' : 'secondaryJoined'}
      align="end"
      groups={[{ name: choiceName, options, selectedId, onSelect }]}
    />
  </div>
);

SplitButton.displayName = 'SplitButton';

export { SplitButton };
