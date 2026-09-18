import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@ValenceUI/cn';
import { POPUP_MOTION } from '@ValenceUI/animations/motion';
import { MENU } from '@ValenceUI/tokens/menu';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import type { ActionMenuProps, ActionMenuSize } from './ActionMenu.types';

const TRIGGER_SIZES: Record<ActionMenuSize, string> = {
  sm: 'size-7',
  md: 'size-9',
};

/**
 * A menu of things to do — rename, rescan, delete — rather than a value to pick, which is what an
 * option menu is for. Items can be grouped, marked destructive so they read as dangerous before
 * they are pressed, and disabled with the reason still visible.
 *
 * An item closes the menu on being chosen, because doing the thing is the end of the errand. An item
 * that sets a value rather than doing a thing can ask to stay open: choosing a theme and having the
 * menu vanish means anybody comparing two of them has to reopen it between each, and the menu is
 * where the answer is shown.
 *
 * @param label - What the menu is, read out to anybody who cannot see it.
 * @param trigger - The control that opens it.
 * @param groups - The items, in groups separated by a rule.
 * @param align - Which edge of the trigger the menu lines up with.
 * @param size - How large the trigger stands — smaller for a row's own action, standing size
 *   elsewhere.
 * @param className - Extra classes for the caller's own layout.
 */
const ActionMenu = ({
  label,
  trigger,
  groups,
  align = 'end',
  size = 'md',
  isDisabled = false,
  className,
}: ActionMenuProps) => {
  const portalContainer = usePortalContainer();

  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger
        aria-label={label}
        disabled={isDisabled}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md outline-none',
          TRIGGER_SIZES[size],
          'text-current transition-colors duration-[var(--duration-instant)] ease-[var(--ease-out)]',
          'motion-reduce:transition-none focus-visible:ring-[3px] focus-visible:ring-ring',
          'hover:bg-[var(--surface-hover)] data-[state=open]:bg-[var(--surface-hover)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        {trigger}
      </RadixMenu.Trigger>

      <RadixMenu.Portal {...(portalContainer === undefined ? {} : { container: portalContainer })}>
        <RadixMenu.Content
          aria-label={label}
          sideOffset={8}
          align={align}
          data-slot="menu-content"
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
            <HoverHighlight rect={rect} radius="nested" className="bg-[var(--surface-hover)]" />

            {groups.map((group, index) => (
              <RadixMenu.Group
                key={group.name ?? `group-${index.toString()}`}
                className={cn(MENU.group, index === 0 ? '' : MENU.groupAfterFirst)}
              >
                {group.name === undefined ? null : (
                  <RadixMenu.Label className={MENU.label}>{group.name}</RadixMenu.Label>
                )}

                {group.items.map((item) => (
                  <RadixMenu.Item
                    key={item.id}
                    data-highlight={item.id}
                    disabled={item.isDisabled ?? false}
                    onSelect={(event) => {
                      if (item.keepsOpen === true) {
                        event.preventDefault();
                      }

                      item.onChoose();
                    }}
                    className={cn(
                      MENU.item,
                      item.isDestructive === true ? 'text-danger' : 'text-text',
                    )}
                  >
                    {item.icon === undefined ? null : (
                      <span className={MENU.icon}>{item.icon}</span>
                    )}

                    <span className={MENU.itemLabel}>{item.label}</span>

                    {item.detail === undefined ? null : (
                      <span className={MENU.detail}>{item.detail}</span>
                    )}
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
