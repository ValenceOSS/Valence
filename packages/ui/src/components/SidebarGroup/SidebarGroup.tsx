import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Button } from '@ValenceUI/Button';
import { SlidingMark } from '@ValenceUI/SlidingMark';
import { cn } from '@ValenceUI/cn';
import { stillTransition, spring } from '@ValenceUI/animations/reveal';
import type { SidebarGroupProps } from './SidebarGroup.types';

const BRANCH = [
  'relative pl-[1.375rem] [--branch:color-mix(in_oklab,var(--color-text)_22%,var(--frame-back))]',
  'before:pointer-events-none before:absolute before:left-[0.9375rem] before:top-0 before:h-1/2',
  'before:w-2 before:rounded-bl-[0.3125rem] before:border-b before:border-l before:border-[var(--branch)]',
  'after:pointer-events-none after:absolute after:left-[0.9375rem] after:top-1/2 after:-bottom-1',
  'after:border-l after:border-[var(--branch)] last:after:hidden',
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
 * @param defaultIsOpen - Whether the group starts open, where nobody holds the answer for it.
 * @param isOpen - Whether the group is open, for a caller that remembers it.
 * @param onOpenChange - Told when the group is opened or folded.
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
  isOpen: heldOpen,
  onOpenChange,
  className,
}: SidebarGroupProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [ownOpen, setOwnOpen] = useState(defaultIsOpen);
  const isOpen = heldOpen ?? ownOpen;
  const showsFold = label !== undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label === undefined ? null : (
        <Button
          variant="bare"
          size="none"
          aria-expanded={isOpen}
          onClick={() => {
            setOwnOpen(!isOpen);
            onOpenChange?.(!isOpen);
          }}
          className={cn(
            'group/fold flex items-center justify-between rounded-md px-2.5 py-1 text-left text-[0.6875rem]',
            'font-medium uppercase tracking-[0.06em] text-text-muted',
            'transition-colors duration-[var(--duration-fast)] hover:text-text',
          )}
        >
          {label}

          <Icon
            of={ChevronDownIcon}
            size={13}
            className={cn(
              'opacity-0 transition-[rotate,opacity] duration-[var(--duration-base)] ease-[var(--ease-out)]',
              'group-hover/fold:opacity-100 group-focus-visible/fold:opacity-100',
              isOpen ? '' : '-rotate-90 opacity-100',
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
            className={cn('flex flex-col overflow-hidden', showsFold ? 'gap-1 pt-1' : 'gap-0.5')}
          >
            {items.map((item) => {
              const isCurrent = item.id === value;
              const isLit = item.id === (pointedAt ?? value);

              return (
                <li key={item.id} className={showsFold ? BRANCH : undefined}>
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
                      'relative isolate flex h-8 w-full items-center justify-start gap-2.5 rounded-md px-2.5',
                      'transition-colors duration-[var(--duration-fast)]',
                      isCurrent ? 'font-medium text-text' : isLit ? 'text-text' : 'text-text-muted',
                    )}
                  >
                    {isLit ? (
                      <SlidingMark
                        group={markGroup}
                        className={
                          isCurrent ? 'bg-[var(--surface-active)]' : 'bg-[var(--surface-hover)]'
                        }
                      />
                    ) : null}

                    <span
                      className={cn(
                        'relative z-10 flex shrink-0',
                        isCurrent ? 'text-text' : 'text-text-muted',
                      )}
                    >
                      <Icon
                        of={item.icon}
                        {...(item.activeIcon === undefined ? {} : { whenActive: item.activeIcon })}
                        size={16}
                        isActive={isCurrent}
                      />
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
