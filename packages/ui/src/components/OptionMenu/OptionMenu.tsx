import { useEffect, useRef, useState } from 'react';
import { Icon } from '@ValenceUI/Icon';
import { Check as CheckIcon } from '@keyline-icons/react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { MENU } from '@ValenceUI/tokens/menu';
import { POPUP_MOTION } from '@ValenceUI/animations/motion';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import type { OptionMenuProps } from './OptionMenu.types';

const HOVER_OPENS_MS = 120;

const HOVER_CLOSES_MS = 220;

/**
 * A menu of choices where exactly one is in force — an audio track, a quality, a sort order. Shows
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
  matchTriggerWidth = false,
  triggerShape = 'icon',
}: OptionMenuProps) => {
  const portalContainer = usePortalContainer();
  const isAnchored = anchor !== undefined;
  const [isOpen, setIsOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openedBy = useRef<'pointer' | 'keyboard'>('pointer');

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
    triggerShape === 'button' ? (
      <RadixMenu.Trigger asChild disabled={isDisabled}>
        <Button
          variant="secondary"
          size="sm"
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
          'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-soft)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          triggerShape === 'field'
            ? cn(
                'h-8 w-full justify-between gap-2 rounded-md px-3 text-[0.8125rem] font-semibold',
                'border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text',
                'hover:bg-[var(--surface-active)]',
              )
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
            'valence-float z-50 flex max-h-80 flex-col overflow-hidden rounded-xl p-1.5 text-sm text-text',
            POPUP_MOTION,
          )}
        >
          <div className="valence-rail flex overflow-x-auto">
            {groups.map((group) => (
              <RadixMenu.Group
                key={group.name}
                className="flex min-w-44 flex-1 flex-col overflow-y-auto rounded-lg border-l border-[var(--surface-line)] pl-1.5 first:border-l-0 first:pl-0"
              >
                <RadixMenu.Label className={MENU.stickyLabel}>{group.name}</RadixMenu.Label>

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
                      className={cn(
                        'flex cursor-default items-center justify-between gap-4 rounded-sm px-3 py-2.5',
                        'outline-none transition-colors duration-[var(--duration-fast)]',
                        'data-[highlighted]:bg-[var(--surface-hover)]',
                        'data-[checked]:text-text',
                      )}
                    >
                      <span className="flex flex-col">
                        {option.label}
                        {option.detail === undefined ? null : (
                          <span className="text-xs text-text-muted">{option.detail}</span>
                        )}
                      </span>

                      <RadixMenu.ItemIndicator className="flex size-4 shrink-0 items-center justify-center text-accent">
                        <Icon of={CheckIcon} size={15} />
                      </RadixMenu.ItemIndicator>
                    </RadixMenu.RadioItem>
                  ))}
                </RadixMenu.RadioGroup>
              </RadixMenu.Group>
            ))}
          </div>

          {footer === undefined ? null : (
            <div className="border-t border-[var(--surface-line)] px-3 py-2.5">{footer}</div>
          )}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
};

OptionMenu.displayName = 'OptionMenu';

export { OptionMenu };
