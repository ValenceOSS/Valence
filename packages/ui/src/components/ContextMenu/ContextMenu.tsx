import * as RadixContextMenu from '@radix-ui/react-context-menu';
import { cn } from '@ValenceUI/cn';
import { POPUP_MOTION } from '@ValenceUI/animations/motion';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { MENU } from '@ValenceUI/tokens/menu';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import type { ContextMenuProps } from './ContextMenu.types';

/**
 * The menu that opens where somebody right-clicks — or presses and holds on a touch screen — over
 * a thing, with what can be done to that thing. It is the same menu as the one behind a button,
 * drawn the same way with the same background following the pointer, only opened from the thing
 * itself and at the pointer rather than from a control beside it.
 *
 * The thing keeps behaving as it did: a click still does what a click did, and the menu is only
 * there for anybody who reaches for it.
 *
 * @param label - What the menu is for, read out to anybody who cannot see it.
 * @param groups - The items, in groups separated by a rule.
 * @param children - The thing the menu belongs to.
 * @param isDisabled - Whether to leave the browser's own menu in place instead.
 * @param className - Extra classes for the area the menu opens over.
 */
const ContextMenu = ({
  label,
  groups,
  children,
  isDisabled = false,
  className,
}: ContextMenuProps) => {
  const portalContainer = usePortalContainer();
  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger disabled={isDisabled} className={cn('block', className)}>
        {children}
      </RadixContextMenu.Trigger>

      <RadixContextMenu.Portal
        {...(portalContainer === undefined ? {} : { container: portalContainer })}
      >
        <RadixContextMenu.Content
          aria-label={label}
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
              <RadixContextMenu.Group
                key={group.name ?? `group-${index.toString()}`}
                className={cn(MENU.group, index === 0 ? '' : MENU.groupAfterFirst)}
              >
                {group.name === undefined ? null : (
                  <RadixContextMenu.Label className={MENU.label}>
                    {group.name}
                  </RadixContextMenu.Label>
                )}

                {group.items.map((item) => (
                  <RadixContextMenu.Item
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
                  </RadixContextMenu.Item>
                ))}
              </RadixContextMenu.Group>
            ))}
          </div>
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
};

ContextMenu.displayName = 'ContextMenu';

export { ContextMenu };
