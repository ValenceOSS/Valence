import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { Icon } from '@ValenceUI/Icon';
import { POPUP_MOTION, PRESS_MOTION } from '@ValenceUI/animations/motion';
import { MENU } from '@ValenceUI/tokens/menu';
import { MenuItemFace } from '@ValenceUI/MenuItemFace';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import { separateDestructive } from './separateDestructive';
import type { ActionMenuProps, ActionMenuSize } from './ActionMenu.types';

const TRIGGER_SIZES: Record<ActionMenuSize, string> = {
  sm: 'size-7',
  md: 'size-8',
};

const LOOKS = {
  plain: '',
  face: 'rounded-full hover:bg-transparent data-[state=open]:bg-transparent',
  pill: 'size-auto rounded-full bg-[var(--surface-hover)] p-1 hover:bg-[var(--surface-active)] data-[state=open]:bg-[var(--surface-active)]',
  raised: cn(
    buttonStyles({ variant: 'glossy', size: 'none' }),
    'hover:bg-[var(--surface-active)] data-[state=open]:bg-[var(--surface-active)]',
  ),
  labelled: cn(
    buttonStyles({ variant: 'secondary', size: 'xs' }),
    'w-auto hover:bg-[var(--surface-active)] data-[state=open]:bg-[var(--surface-active)]',
  ),
  segment: cn(JOINED_LOOKS.segment, 'w-auto rounded-none'),
} as const;

/**
 * A menu of things to do — rename, rescan, delete — rather than a value to pick, which is what an
 * option menu is for. A group can hold a control of its own in place of items — a row of tabs for a
 * choice between a few, say — and items can be grouped, marked destructive so they read as dangerous before
 * they are pressed, and disabled with the reason still visible.
 *
 * An item that is already what it would make so — the profile watching, in a list of them — is
 * marked with a tick, and read out as the current one.
 *
 * An item that needs explaining carries a hint, drawn as an information mark that says it on hover,
 * rather than a line of small print that makes every row of the menu taller.
 *
 * Pressing it, or anything in it, is not a press on whatever it sits inside, so a menu in the row of
 * a table does not also choose the row.
 *
 * An item closes the menu on being chosen, because doing the thing is the end of the errand. An item
 * that sets a value rather than doing a thing can ask to stay open: choosing a theme and having the
 * menu vanish means anybody comparing two of them has to reopen it between each, and the menu is
 * where the answer is shown.
 *
 * @param label - What the menu is, read out to anybody who cannot see it.
 * @param trigger - The control that opens it, the row's own three dots unless told otherwise, so
 *   every menu of a row's actions opens from the same mark.
 * @param groups - The items, in groups separated by a rule. Destructive items are gathered into a
 *   group of their own at the bottom whatever order they were written in.
 * @param align - Which edge of the trigger the menu lines up with.
 * @param size - How large the trigger stands — smaller for a row's own action, standing size
 *   elsewhere.
 * @param look - Plain, lit only when pointed at; a face, which is a circle that is not lit at all,
 *   for a picture standing in as the control; raised, with a fill and an edge of its own, for a
 *   control that has to be found on a busy row; or labelled, sized to words rather than a glyph, for
 *   a menu that says what it is; or a segment, one part of a joined row of them.
 * @param onOpenChange - Told when it opens or closes, for a caller that must not vanish from under
 *   it while it is open.
 * @param className - Extra classes for the caller's own layout.
 */
const ActionMenu = ({
  label,
  trigger,
  groups,
  align = 'end',
  size = 'md',
  look = 'plain',
  isDisabled = false,
  onOpenChange,
  className,
}: ActionMenuProps) => {
  const portalContainer = usePortalContainer();

  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  return (
    <RadixMenu.Root {...(onOpenChange === undefined ? {} : { onOpenChange })}>
      <RadixMenu.Trigger
        aria-label={label}
        disabled={isDisabled}
        onClick={(event) => {
          event.stopPropagation();
        }}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg outline-none',
          TRIGGER_SIZES[size],
          'text-current',
          PRESS_MOTION,
          'focus-visible:ring-[3px] focus-visible:ring-ring',
          'hover:bg-[var(--surface-hover)] data-[state=open]:bg-[var(--surface-hover)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          LOOKS[look],
          className,
        )}
      >
        {trigger ?? <Icon of={MoreHorizontalIcon} size={16} />}
      </RadixMenu.Trigger>

      <RadixMenu.Portal {...(portalContainer === undefined ? {} : { container: portalContainer })}>
        <RadixMenu.Content
          aria-label={label}
          sideOffset={8}
          align={align}
          data-slot="menu-content"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className={cn(MENU.content, POPUP_MOTION)}
        >
          <div
            ref={containerRef}
            className="relative flex flex-col"
            onPointerMove={follow}
            onPointerLeave={clear}
            onFocusCapture={follow}
            onBlurCapture={clear}
          >
            <HoverHighlight rect={rect} radius="nested" />

            {separateDestructive(groups).map((group, index) => (
              <RadixMenu.Group
                key={group.name ?? `group-${index.toString()}`}
                className={cn(MENU.group, index === 0 ? '' : MENU.groupAfterFirst)}
              >
                {group.name === undefined ? null : (
                  <RadixMenu.Label className={MENU.label}>{group.name}</RadixMenu.Label>
                )}

                {group.control === undefined ? null : (
                  <div className="relative z-10 px-2 py-1.5">{group.control}</div>
                )}

                {group.items.map((item) => (
                  <RadixMenu.Item
                    key={item.id}
                    data-highlight={item.id}
                    disabled={item.isDisabled ?? false}
                    {...(item.isCurrent === true ? { 'aria-current': 'true' as const } : {})}
                    onSelect={(event) => {
                      if (item.keepsOpen === true) {
                        event.preventDefault();
                      }

                      item.onChoose();
                    }}
                    className={cn(
                      MENU.item,
                      item.isDestructive === true ? MENU.itemDestructive : MENU.itemPlain,
                    )}
                  >
                    <MenuItemFace item={item} />
                  </RadixMenu.Item>
                ))}
              </RadixMenu.Group>
            ))}
          </div>
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
};

ActionMenu.displayName = 'ActionMenu';

export { ActionMenu };
