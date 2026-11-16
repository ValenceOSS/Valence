import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { cn } from '@ValenceUI/cn';
import { PLAY_FACE } from '@ValenceUI/tokens/PLAY_FACE';
import type { SplitButtonProps } from './SplitButton.types';

const JOINED_SHAPES = {
  confirm: 'confirmJoined',
  secondary: 'secondaryJoined',
  raised: 'raisedJoined',
} as const;

const PARTED_SHAPES = {
  confirm: 'confirmParted',
  secondary: 'secondaryParted',
  raised: 'raisedParted',
} as const;

const PLAY_ARROW =
  'size-[3.25rem] coarse:size-[3.25rem] rounded-e-[0.875rem] shadow-[var(--shadow-lifted)]';

const PARTED_FACE =
  'h-11 gap-2 rounded-[0.75rem] rounded-e-[4px] px-4 text-[0.9375rem] font-semibold shadow-[var(--shadow-lifted)]';

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
 * @param size - How large it stands: as large as a title's Play button, matching the play face and
 *   anything joined beside it; large for the answer of a page; small for a card's heading.
 * @param shape - Whether the arrow runs on from the action behind a hairline, or sits a sliver
 *   apart as its own square, the way Play and Start again stand on a title.
 * @param footer - Something to say beneath the choices, such as what changing them does.
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
  size = 'lg',
  shape = 'joined',
  footer,
  className,
}: SplitButtonProps) => (
  <div className={cn('inline-flex min-w-0', shape === 'parted' ? 'gap-[3px]' : '', className)}>
    <Button
      variant={tone}
      size={shape === 'parted' || size === 'play' ? 'none' : size}
      {...(shape === 'parted' ? {} : { joins: 'next' as const })}
      className={cn(
        'min-w-0 flex-1',
        shape === 'parted'
          ? PARTED_FACE
          : cn(
              size === 'play' ? cn(PLAY_FACE, 'rounded-e-none') : '',
              tone === 'confirm' ? '' : 'border-e-0',
              tone === 'raised' ? 'shadow-none' : '',
            ),
      )}
      onClick={onClick}
    >
      {children}
    </Button>

    <OptionMenu
      label={choiceLabel}
      trigger={<Icon of={ChevronDownIcon} size={size === 'sm' ? 14 : size === 'play' ? 18 : 16} />}
      triggerShape={shape === 'parted' ? PARTED_SHAPES[tone] : JOINED_SHAPES[tone]}
      align="end"
      groups={[{ name: choiceName, options, selectedId, onSelect }]}
      {...(size === 'sm'
        ? { className: 'size-7 before:inset-y-1.5' }
        : size === 'play' && shape === 'joined'
          ? { className: cn(PLAY_ARROW, 'before:inset-y-3.5') }
          : {})}
      {...(footer === undefined ? {} : { footer })}
    />
  </div>
);

SplitButton.displayName = 'SplitButton';

export { SplitButton };
