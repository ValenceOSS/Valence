import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { Button } from '@ValenceUI/Button';
import { SlidingMark } from '@ValenceUI/SlidingMark';
import { cn } from '@ValenceUI/cn';
import { stillTransition, spring } from '@ValenceUI/animations/reveal';
import type { SidebarGroupProps } from './SidebarGroup.types';

const OPENS = [
  'transition-[width,margin,opacity] duration-[var(--duration-base)] ease-[var(--ease-soft)]',
  'motion-reduce:transition-none',
].join(' ');

/**
 * One labelled cluster of a sidebar's destinations, foldable so a long rail can hold many groups
 * without holding all of them open at once. Ungrouped items — no `label` — are never foldable, since
 * there is nothing to name the fold after.
 *
 * @param label - What the group is, shown above its items.
 * @param items - The destinations in this group.
 * @param value - Which destination is current.
 * @param onSelect - Told which destination was chosen.
 * @param markGroup - The rail-wide name the travelling highlight answers to, so it slides between
 *   items in different groups rather than jumping.
 * @param pointedAt - Which item the pointer rests on, for the whole rail.
 * @param onPointAt - Told which item the pointer now rests on, or none.
 * @param defaultIsOpen - Whether the group starts open.
 * @param className - Extra classes for the caller's own layout.
 */
const SidebarGroup = ({
  label,
  items,
  value,
  onSelect,
  markGroup,
  pointedAt,
  onPointAt,
  defaultIsOpen = true,
  className,
}: SidebarGroupProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  const showsFold = label !== undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label === undefined ? null : (
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
            className="flex flex-col gap-0.5 overflow-hidden"
          >
            {items.map((item) => {
              const isCurrent = item.id === value;
              const isLit = item.id === (pointedAt ?? value);

              return (
                <li key={item.id}>
                  <Button
                    variant="bare"
                    size="sm"
                    label={item.label}
                    hasTooltip={false}
                    aria-current={isCurrent ? 'page' : undefined}
                    onPointerEnter={() => {
                      onPointAt(item.id);
                    }}
                    onFocus={() => {
                      onPointAt(item.id);
                    }}
                    onClick={() => {
                      onSelect(item.id);
                    }}
                    className={cn(
                      'relative isolate flex w-full items-center justify-start gap-2.5 rounded-md px-2.5',
                      'transition-colors duration-[var(--duration-fast)]',
                      isCurrent
                        ? 'font-semibold text-accent'
                        : isLit
                          ? 'text-text'
                          : 'text-text-muted',
                    )}
                  >
                    {isLit ? (
                      <SlidingMark
                        group={markGroup}
                        className={isCurrent ? 'bg-accent/15' : 'bg-[var(--surface-active)]'}
                      />
                    ) : null}

                    <span
                      className={cn(
                        'relative z-10 flex shrink-0 overflow-hidden',
                        OPENS,
                        isCurrent ? 'ml-0 w-[17px] opacity-100' : '-ml-2.5 w-0 opacity-0',
                      )}
                    >
                      <Icon of={item.icon} size={17} isActive={isCurrent} />
                    </span>

                    <span className="relative z-10 truncate">{item.label}</span>
                  </Button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

SidebarGroup.displayName = 'SidebarGroup';

export { SidebarGroup };
