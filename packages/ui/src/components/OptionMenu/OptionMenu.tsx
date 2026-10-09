import { useEffect, useRef, useState } from 'react';
import { Icon } from '@ValenceUI/Icon';
import { Check as CheckIcon } from '@keyline-icons/react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { MENU } from '@ValenceUI/tokens/menu';
import { FIELD_TRIGGER } from '@ValenceUI/tokens/fieldTrigger';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { POPUP_MOTION, PRESS_MOTION } from '@ValenceUI/animations/motion';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import type { MenuOption, OptionMenuProps } from './OptionMenu.types';

const HOVER_OPENS_MS = 120;

const OPTION_ROW = cn(
  'relative z-10 flex min-h-8 cursor-default items-center justify-between gap-4 rounded-md px-2.5 py-1.5',
  'text-text-muted outline-none transition-colors duration-[var(--duration-fast)]',
  'hover:text-text focus:text-text data-[state=checked]:bg-[var(--surface-hover)] data-[state=checked]:text-text',
  'data-[disabled]:cursor-not-allowed data-[disabled]:hover:text-text-muted',
);

const HOVER_CLOSES_MS = 220;

/**
 * What one choice in the menu says, with what more there is to say of it beneath, and a tick
 * at the end of its row while it is in force.
 *
 * @param option - The choice.
 */
const OptionText = ({ option }: { option: MenuOption }) => (
  <>
    <span className="flex flex-col gap-0.5">
      {option.label}
      {option.detail === undefined ? null : (
        <span className="text-xs text-text-muted">{option.detail}</span>
      )}
    </span>

    <RadixMenu.ItemIndicator className="flex size-4 shrink-0 items-center justify-center text-text">
      <Icon of={CheckIcon} size={15} />
    </RadixMenu.ItemIndicator>
  </>
);

/**
 * A menu of choices where one is in force, or, in a group that allows it, any number — an audio
 * track, a quality, a sort order, the apps that may sign in. Shows
 * which is chosen rather than only changing what is beneath it, and lays out in columns where there
 * are more options than a single list would read well.
 *
 * @param label - What is being chosen, read out to anybody who cannot see the menu.
 * @param trigger - The control that opens it.
 * @param anchor - Instead of a control of its own, something that already does its own job, such as a
 *   button that goes somewhere: the menu appears when the pointer rests on it, or when the down
 *   arrow is pressed on it, and pressing it still does what it did.
 * @param columns - The choices, in one or more named columns.
 * @param className - Extra classes for the caller's own layout.
 * @param size - How tall its field is, to sit level with the fields and buttons beside it.
 * @param triggerShape - How its own control is drawn: a glyph, a field, a button, a quiet
 *   button for the heading of a card, or an arrow that runs on from the button before it and is
 *   painted as that button.
 */
const OptionMenu = ({
  label,
  trigger,
  anchor,
  groups,
  footer,
  isDisabled = false,
  className,
  align = 'end',
  matchTriggerWidth = true,
  size = 'md',
  triggerShape = 'icon',
}: OptionMenuProps) => {
  const portalContainer = usePortalContainer();
  const isAnchored = anchor !== undefined;
  const [isOpen, setIsOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openedBy = useRef<'pointer' | 'keyboard'>('pointer');
  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const stayOpen = () => {
    clearTimeout(timer.current);
  };

  const openSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      openedBy.current = 'pointer';
      setIsOpen(true);
    }, HOVER_OPENS_MS);
  };

  const closeSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setIsOpen(false);
    }, HOVER_CLOSES_MS);
  };

  const control =
    triggerShape === 'button' || triggerShape === 'quiet' ? (
      <RadixMenu.Trigger asChild disabled={isDisabled}>
        <Button
          variant={triggerShape === 'quiet' ? 'ghost' : 'secondary'}
          size={triggerShape === 'quiet' ? 'xs' : 'sm'}
          label={label}
          hasTooltip={false}
          {...(className === undefined ? {} : { className })}
        >
          {trigger}
        </Button>
      </RadixMenu.Trigger>
    ) : (
      <RadixMenu.Trigger
        aria-label={label}
        title={label}
        disabled={isDisabled}
        className={cn(
          'inline-flex shrink-0 items-center text-current',
          PRESS_MOTION,
          'disabled:cursor-not-allowed disabled:opacity-50',
          triggerShape === 'confirmJoined'
            ? JOINED_LOOKS.confirm
            : triggerShape === 'secondaryJoined'
              ? JOINED_LOOKS.secondary
              : triggerShape === 'raisedJoined'
                ? JOINED_LOOKS.raised
                : triggerShape === 'field'
                  ? cn(FIELD_TRIGGER.base, FIELD_TRIGGER[size])
                  : cn(
                      'size-8 justify-center rounded-md',
                      'hover:bg-[var(--surface-hover)] data-[state=open]:bg-[var(--surface-active)]',
                    ),
          className,
        )}
      >
        {trigger}
      </RadixMenu.Trigger>
    );

  const anchored = (
    <span
      className={cn('relative inline-flex', className)}
      onPointerEnter={openSoon}
      onPointerLeave={closeSoon}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          openedBy.current = 'keyboard';
          setIsOpen(true);
        }
      }}
    >
      {anchor}

      <RadixMenu.Trigger asChild>
        <span aria-hidden className="pointer-events-none absolute inset-0" />
      </RadixMenu.Trigger>
    </span>
  );

  return (
    <RadixMenu.Root
      {...(isAnchored ? { open: isOpen, onOpenChange: setIsOpen, modal: false } : {})}
    >
      {isAnchored ? anchored : control}

      <RadixMenu.Portal {...(portalContainer === undefined ? {} : { container: portalContainer })}>
        <RadixMenu.Content
          sideOffset={8}
          align={align}
          aria-label={label}
          {...(isAnchored
            ? {
                onPointerEnter: stayOpen,
                onPointerLeave: closeSoon,
                onOpenAutoFocus: (event: Event) => {
                  if (openedBy.current === 'pointer') {
                    event.preventDefault();
                  }
                },
                onCloseAutoFocus: (event: Event) => {
                  event.preventDefault();
                },
              }
            : {})}
          {...(matchTriggerWidth
            ? { style: { minWidth: 'var(--radix-dropdown-menu-trigger-width)' } }
            : {})}
          className={cn(
            'valence-menu z-50 flex max-h-80 flex-col overflow-hidden rounded-lg p-1 text-[0.8125rem] font-medium text-text',
            POPUP_MOTION,
          )}
        >
          <div
            ref={containerRef}
            className="valence-rail relative flex overflow-x-auto"
            onPointerMove={follow}
            onPointerLeave={clear}
            onFocusCapture={follow}
            onBlurCapture={clear}
          >
            {groups.map((group) => (
              <RadixMenu.Group
                key={group.name}
                className="flex min-w-40 flex-1 flex-col overflow-y-auto rounded-md border-l border-[var(--surface-line)] pl-1 first:border-l-0 first:pl-0"
              >
                <RadixMenu.Label className={MENU.stickyLabel}>{group.name}</RadixMenu.Label>

                {'selectedIds' in group ? (
                  <div className="flex flex-col">
                    {group.options.map((option) => (
                      <RadixMenu.CheckboxItem
                        key={option.id}
                        checked={group.selectedIds.includes(option.id)}
                        disabled={group.lockedIds?.includes(option.id) === true}
                        data-highlight={`${group.name}:${option.id}`}
                        onSelect={(event) => {
                          event.preventDefault();
                        }}
                        onCheckedChange={(isChosen) => {
                          group.onToggle(option.id, isChosen === true);
                        }}
                        className={OPTION_ROW}
                      >
                        <OptionText option={option} />
                      </RadixMenu.CheckboxItem>
                    ))}
                  </div>
                ) : (
                  <RadixMenu.RadioGroup
                    value={group.selectedId}
                    onValueChange={(next) => {
                      group.onSelect(String(next));
                    }}
                    className="flex flex-col"
                  >
                    {group.options.map((option) => (
                      <RadixMenu.RadioItem
                        key={option.id}
                        value={option.id}
                        data-highlight={`${group.name}:${option.id}`}
                        className={OPTION_ROW}
                      >
                        <OptionText option={option} />
                      </RadixMenu.RadioItem>
                    ))}
                  </RadixMenu.RadioGroup>
                )}
              </RadixMenu.Group>
            ))}

            <HoverHighlight rect={rect} radius="nested" />
          </div>

          {footer === undefined ? null : (
            <div className="border-t border-[var(--surface-line)] px-2.5 py-2">{footer}</div>
          )}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
};

OptionMenu.displayName = 'OptionMenu';

export { OptionMenu };
