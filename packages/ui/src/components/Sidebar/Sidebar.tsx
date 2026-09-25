import { useEffect, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { PanelLeft as PanelLeftIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Button } from '@ValenceUI/Button';
import { SidebarGroup } from '@ValenceUI/SidebarGroup';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import { scrollDeltaToReveal } from './scrollDeltaToReveal';
import type { SidebarProps } from './Sidebar.types';

const REVEAL_MARGIN = 16;

/**
 * The one column of destinations standing against the left edge of a full page — an admin area, an
 * account — grouped and foldable rather than a flat list, and reducible to icons for a page that
 * wants the width back. This is the sidebar the dialogs it replaces never had: those switched
 * sections with a row of tabs across the top, which is not a shape that scales to eleven of them.
 *
 * The highlight travels between destinations rather than jumping between them, the same way it does
 * in the bar across the top of the browsing pages — one name for the mark shared across every group,
 * so moving the pointer from one group into the next still reads as one thing sliding rather than two
 * marks taking turns.
 *
 * Choosing a destination, or arriving at one from somewhere else in the page, brings its name into
 * view by scrolling the list smoothly to it, rather than leaving the current one somewhere below the
 * fold or snapping there.
 *
 * Closes flush rather than to a rail of icons: a destination nobody can read the name of is not
 * worth the width it still spends, so the toggle takes the whole thing away and a trigger of the
 * host page's own brings it back — the same shape a drawer on a narrow screen already needs.
 *
 * @param label - What the sidebar is for, read out to anybody who cannot see it.
 * @param brand - The mark at the top, usually a link back out of this area entirely.
 * @param groups - The destinations, in groups.
 * @param value - Which destination is current.
 * @param onSelect - Told which destination was chosen.
 * @param isCollapsed - Whether the sidebar is closed.
 * @param onCollapsedChange - Told when the close toggle is pressed.
 * @param footer - What sits pinned below every group — sign out, a theme choice, an account face.
 * @param variant - Whether it stands flush against the page's own edge, or floats a step in from
 *   every edge with a border and a shadow of its own.
 * @param className - Extra classes for the caller's own layout.
 */
const Sidebar = ({
  label,
  brand,
  groups,
  value,
  onSelect,
  isCollapsed = false,
  onCollapsedChange,
  footer,
  variant = 'flush',
  className,
}: SidebarProps) => {
  const [pointedAt, setPointedAt] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotionConfig();
  const markGroup = `sidebar-mark-${label}`;
  const isFloating = variant === 'floating';

  useEffect(() => {
    const list = scroller.current;

    if (list === null || list.clientHeight === 0) {
      return;
    }

    const current = list.querySelector('[aria-current="page"]');

    if (current === null) {
      return;
    }

    const delta = scrollDeltaToReveal(
      list.getBoundingClientRect(),
      current.getBoundingClientRect(),
      REVEAL_MARGIN,
    );

    if (delta !== 0) {
      list.scrollBy({ top: delta, behavior: prefersReducedMotion === true ? 'auto' : 'smooth' });
    }
  }, [value, prefersReducedMotion]);

  return (
    <nav
      aria-label={label}
      aria-hidden={isCollapsed}
      className={cn(
        'valence-surface flex flex-col overflow-hidden py-4',
        'transition-[width,margin] duration-200 ease-out',
        isFloating ? 'self-stretch' : 'h-full',
        isCollapsed
          ? 'm-0 w-0'
          : isFloating
            ? 'my-6 ml-6 w-64 rounded-2xl border border-[var(--surface-line)] shadow-[var(--shadow-lifted)]'
            : 'valence-surface--right-edge w-64',
        className,
      )}
    >
      <div className="flex w-64 shrink-0 items-center justify-between gap-2 border-b border-[var(--surface-line)] px-3 pb-4">
        {brand === undefined ? null : (
          <div className="flex min-w-0 flex-1 items-center gap-2">{brand}</div>
        )}

        {onCollapsedChange === undefined ? null : (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            label={say('ui.sidebar.close')}
            onClick={() => {
              onCollapsedChange(true);
            }}
          >
            <Icon of={PanelLeftIcon} size={17} />
          </Button>
        )}
      </div>

      <div
        ref={scroller}
        onPointerLeave={() => {
          setPointedAt(null);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPointedAt(null);
          }
        }}
        className="flex w-64 shrink-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pt-4"
      >
        {groups.map((group, index) => (
          <SidebarGroup
            key={group.label ?? `group-${index.toString()}`}
            {...(group.label === undefined ? {} : { label: group.label })}
            items={group.items}
            value={value}
            onSelect={onSelect}
            markGroup={markGroup}
            pointedAt={pointedAt}
            onPointAt={setPointedAt}
          />
        ))}
      </div>

      {footer === undefined ? null : (
        <div className="flex w-64 shrink-0 flex-col gap-2 border-t border-[var(--surface-line)] px-3 pt-3">
          {footer}
        </div>
      )}
    </nav>
  );
};

Sidebar.displayName = 'Sidebar';

export { Sidebar };
