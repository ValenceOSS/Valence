import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { Button } from '@ValenceUI/Button';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { staggerVariants, stillTransition, spring } from '@ValenceUI/animations/reveal';
import type { SidebarGroupProps } from './SidebarGroup.types';

/**
 * One labelled cluster of a sidebar's destinations, foldable so a long rail can hold many groups
 * without holding all of them open at once. Ungrouped items — no `label` — are never foldable, since
 * there is nothing to name the fold after.
 *
 * Collapses to icons rather than folding away when the whole rail is a rail: a name nobody can read
 * is not worth spending the width on, but the destinations themselves still have to reach every item,
 * so the fold itself is skipped in that state rather than left closed.
 *
 * @param label - What the group is, shown above its items.
 * @param items - The destinations in this group.
 * @param value - Which destination is current.
 * @param onSelect - Told which destination was chosen.
 * @param isRailCollapsed - Whether the whole sidebar is showing icons only.
 * @param defaultIsOpen - Whether the group starts open.
 * @param className - Extra classes for the caller's own layout.
 */
const SidebarGroup = ({
  label,
  items,
  value,
  onSelect,
  isRailCollapsed = false,
  defaultIsOpen = true,
  className,
}: SidebarGroupProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  const showsFold = label !== undefined && !isRailCollapsed;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label === undefined ? null : isRailCollapsed ? (
        <span aria-hidden className="mx-auto h-px w-6 bg-[var(--surface-divider)]" />
      ) : (
        <Button
          variant="bare"
          size="none"
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen((was) => !was);
          }}
          className={cn(
            'flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[0.6875rem]',
            'font-medium uppercase tracking-[0.14em] text-text-muted',
            'transition-colors duration-[var(--duration-fast)] hover:text-text',
          )}
        >
          {label}

          <Icon
            of={ArrowDown01Icon}
            size={13}
            className={cn(
              'transition-transform duration-[var(--duration-fast)]',
              isOpen ? '' : '-rotate-90',
            )}
          />
        </Button>
      )}

      <AnimatePresence initial={false}>
        {!showsFold || isOpen ? (
          <motion.ul
            initial={showsFold ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? stillTransition : spring}
            variants={staggerVariants}
            className="flex flex-col gap-0.5 overflow-hidden"
          >
            {items.map((item, index) => (
              <RevealItem key={item.id} index={index}>
                <Button
                  variant="ghost"
                  size={isRailCollapsed ? 'none' : 'sm'}
                  isIconOnly={isRailCollapsed}
                  isActive={item.id === value}
                  hasTooltip={isRailCollapsed}
                  label={item.label}
                  aria-current={item.id === value ? 'page' : undefined}
                  onClick={() => {
                    onSelect(item.id);
                  }}
                  className={cn(
                    'w-full justify-start gap-2.5',
                    isRailCollapsed ? 'mx-auto size-9' : 'px-2.5',
                  )}
                >
                  <Icon of={item.icon} size={17} />
                  {isRailCollapsed ? null : <span className="truncate">{item.label}</span>}
                </Button>
              </RevealItem>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

SidebarGroup.displayName = 'SidebarGroup';

export { SidebarGroup };
