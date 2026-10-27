import { useEffect, useRef, useState } from 'react';
import { Icon } from '@ValenceUI/Icon';
import {
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
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
import type { MenuGroup, MenuOption, OptionMenuProps } from './OptionMenu.types';
import { say } from '@ValenceI18n/say';

const HOVER_OPENS_MS = 120;

const OPTION_ROW = cn(
  MENU.item,
  'relative z-10 text-text transition-colors duration-[var(--duration-fast)]',
);

const HOVER_CLOSES_MS = 220;

/**
 * What a group of a menu has chosen, said beside it where its choices are folded away: how many are
 * ticked, or the one picked where that is not the first choice it offers.
 *
 * @param group - The group.
 * @returns What it has chosen, or nothing where it has chosen nothing worth saying.
 */
const chosenIn = (group: MenuGroup): string | null => {
  if ('selectedIds' in group) {
    return group.selectedIds.length === 0 ? null : String(group.selectedIds.length);
  }

  return group.selectedId === group.options[0]?.id
    ? null
    : (group.options.find((option) => option.id === group.selectedId)?.label ?? null);
};

/**
 * What one choice in the menu says: a tick or a dot at the start of its row while it is in force,
 * the choice itself, and what more there is to say of it set quietly at the end.
 *
 * @param option - The choice.
 * @param mark - Whether being chosen is shown with a tick, for one of many, or a dot, for the one.
 */
const OptionText = ({ option, mark }: { option: MenuOption; mark: 'tick' | 'dot' }) => (
  <>
    <span className={MENU.marker}>
      <RadixMenu.ItemIndicator className="flex items-center justify-center">
        {mark === 'tick' ? <Icon of={CheckIcon} size={14} /> : <span className={MENU.dot} />}
      </RadixMenu.ItemIndicator>
    </span>

    <span className={MENU.itemLabel}>{option.label}</span>

    {option.detail === undefined ? null : <span className={MENU.detail}>{option.detail}</span>}
  </>
);

/**
 * A menu of choices where one is in force, or, in a group that allows it, any number — an audio
 * track, a quality, a sort order, the apps that may sign in. Shows
 * which is chosen rather than only changing what is beneath it, each named group of choices under
 * a quiet heading, one beneath another.
 *
 * @param label - What is being chosen, read out to anybody who cannot see the menu.
 * @param trigger - The control that opens it.
 * @param anchor - Instead of a control of its own, something that already does its own job, such as a
 *   button that goes somewhere: the menu appears when the pointer rests on it, or when the down
 *   arrow is pressed on it, and pressing it still does what it did.
 * @param columns - The choices, in one or more named columns.
 * @param className - Extra classes for the caller's own layout.
 * @param size - How tall its field is, to sit level with the fields and buttons beside it.
 * @param triggerShape - How its own control is drawn: a glyph, a field, a choice that runs on
 *   from the text field before it, one segment of a row of joined choices, a button, a quiet button for the heading of a card, or an arrow
 *   that runs on from the button before it and is painted as that button.
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
  drillsIn = false,
  size = 'md',
  triggerShape = 'icon',
}: OptionMenuProps) => {
  const portalContainer = usePortalContainer();
  const isAnchored = anchor !== undefined;
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const hasMoved = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openedBy = useRef<'pointer' | 'keyboard'>('pointer');
  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (!hasMoved.current) {
      return;
    }

    hasMoved.current = false;
    containerRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
  }, [openGroup, containerRef]);

  const moveTo = (group: string | null) => {
    hasMoved.current = true;
    setOpenGroup(group);
  };

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
          size="xs"
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
        {...(triggerShape === 'fieldJoined' ? {} : { title: label })}
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
                  : triggerShape === 'fieldJoined'
                    ? JOINED_LOOKS.field
                    : triggerShape === 'segment'
                      ? JOINED_LOOKS.segment
                      : cn(
                          'size-8 justify-center rounded-lg',
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

  const drawGroup = (group: MenuGroup, isLabelled: boolean) => (
    <RadixMenu.Group
      key={group.name}
      className={cn(MENU.group, 'min-w-44 [&:not(:first-child)]:mt-2')}
    >
      {isLabelled ? (
        <RadixMenu.Label className={MENU.stickyLabel}>{group.name}</RadixMenu.Label>
      ) : null}

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
              <OptionText option={option} mark="tick" />
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
              <OptionText option={option} mark="dot" />
            </RadixMenu.RadioItem>
          ))}
        </RadixMenu.RadioGroup>
      )}
    </RadixMenu.Group>
  );

  const opened = drillsIn ? groups.find((group) => group.name === openGroup) : undefined;

  return (
    <RadixMenu.Root
      {...(isAnchored ? { open: isOpen, modal: false } : {})}
      onOpenChange={(next) => {
        if (!next) {
          setOpenGroup(null);
        }

        if (isAnchored) {
          setIsOpen(next);
        }
      }}
    >
      {isAnchored ? anchored : control}

      <RadixMenu.Portal {...(portalContainer === undefined ? {} : { container: portalContainer })}>
        <RadixMenu.Content
          sideOffset={8}
          align={align}
          aria-label={label}
          onKeyDown={(event) => {
            const back =
              getComputedStyle(event.currentTarget).direction === 'rtl'
                ? 'ArrowRight'
                : 'ArrowLeft';

            if (drillsIn && openGroup !== null && event.key === back) {
              event.preventDefault();
              moveTo(null);
            }
          }}
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
          className={cn(MENU.content, 'flex max-h-[min(70vh,34rem)] flex-col', POPUP_MOTION)}
        >
          <div
            ref={containerRef}
            className="relative flex flex-col overflow-y-auto"
            onPointerMove={follow}
            onPointerLeave={clear}
            onFocusCapture={follow}
            onBlurCapture={clear}
          >
            {!drillsIn ? (
              groups.map((group) => drawGroup(group, true))
            ) : opened === undefined ? (
              <RadixMenu.Group className={cn(MENU.group, 'min-w-44')}>
                {groups.map((group) => {
                  const chosen = chosenIn(group);

                  return (
                    <RadixMenu.Item
                      key={group.name}
                      data-highlight={`open:${group.name}`}
                      onSelect={(event) => {
                        event.preventDefault();
                        moveTo(group.name);
                      }}
                      className={OPTION_ROW}
                    >
                      <span className={MENU.itemLabel}>{group.name}</span>
                      {chosen === null ? null : <span className={MENU.detail}>{chosen}</span>}
                      <Icon
                        of={ChevronRightIcon}
                        size={14}
                        tone="muted"
                        className="shrink-0 rtl:-scale-x-100"
                      />
                    </RadixMenu.Item>
                  );
                })}
              </RadixMenu.Group>
            ) : (
              <>
                <RadixMenu.Item
                  aria-label={[say('common.back'), opened.name].join(' ')}
                  data-highlight="back"
                  onSelect={(event) => {
                    event.preventDefault();
                    moveTo(null);
                  }}
                  className={cn(OPTION_ROW, 'gap-2 font-medium')}
                >
                  <Icon
                    of={ChevronLeftIcon}
                    size={14}
                    tone="muted"
                    className="shrink-0 rtl:-scale-x-100"
                  />
                  <span className={MENU.itemLabel}>{opened.name}</span>
                </RadixMenu.Item>

                {drawGroup(opened, false)}
              </>
            )}

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
