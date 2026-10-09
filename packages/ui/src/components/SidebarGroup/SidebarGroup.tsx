import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Button } from '@ValenceUI/Button';
import { SlidingMark } from '@ValenceUI/SlidingMark';
import { cn } from '@ValenceUI/cn';
import { stillTransition, spring } from '@ValenceUI/animations/reveal';
import type { SidebarGroupProps } from './SidebarGroup.types';

const TRACK = [
  'relative ml-[1.0625rem] pl-2.5',
  'before:pointer-events-none before:absolute before:inset-y-1 before:left-0 before:w-px',
  'before:bg-[color-mix(in_oklab,var(--color-text)_18%,transparent)]',
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
  isCollapsed = false,
  className,
}: SidebarGroupProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [ownOpen, setOwnOpen] = useState(defaultIsOpen);
  const isOpen = heldOpen ?? ownOpen;
  const showsFold = label !== undefined;

  return (
    <div className={cn('flex flex-col', isCollapsed ? 'gap-1' : 'gap-1', className)}>
      {label === undefined || isCollapsed ? null : (
        <Button
          variant="bare"
          size="none"
          aria-expanded={isOpen}
          onClick={() => {
            setOwnOpen(!isOpen);
            onOpenChange?.(!isOpen);
          }}
          className={cn(
            'group/fold flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[0.8125rem]',
            'font-medium text-text',
          )}
        >
          <Icon
            of={ChevronDownIcon}
            size={14}
            className={cn(
              'shrink-0 text-text-muted transition-[rotate,color] duration-[var(--duration-base)] ease-[var(--ease-out)]',
              'group-hover/fold:text-text',
              isOpen ? '' : '-rotate-90',
            )}
          />

          {label}
        </Button>
      )}

      <AnimatePresence initial={false}>
        {isCollapsed || !showsFold || isOpen ? (
          <motion.ul
            initial={showsFold && !isCollapsed ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? stillTransition : spring}
            className={cn(
              'flex flex-col overflow-hidden',
              isCollapsed ? 'gap-1' : showsFold ? cn('gap-1 pt-1', TRACK) : 'gap-0.5',
            )}
          >
            {items.map((item) => {
              const isCurrent = item.id === value;
              const isLit = item.id === (pointedAt ?? value);

              return (
                <li key={item.id} className={showsFold && !isCollapsed ? 'relative' : undefined}>
                  {isCurrent && showsFold && !isCollapsed ? (
                    <SlidingMark
                      group={`${markGroup}-track`}
                      className="inset-auto -left-[0.6875rem] inset-y-1.5 z-10 w-0.5 rounded-full bg-text"
                    />
                  ) : null}

                  <Button
                    variant="bare"
                    size="sm"
                    label={item.label}
                    hasTooltip={isCollapsed}
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
                      'relative isolate flex rounded-md',
                      'transition-colors duration-[var(--duration-fast)]',
                      isCollapsed
                        ? 'h-10 w-10 items-center justify-center px-0'
                        : 'h-8 w-full items-center justify-start gap-2.5 px-2.5',
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

                    {isCollapsed ? null : (
                      <span className="relative z-10 truncate">{item.label}</span>
                    )}
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
