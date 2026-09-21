import { Check as CheckIcon, Filter as FilterIcon } from '@keyline-icons/react';
import { Filter as FilterFilledIcon } from '@keyline-icons/react/fill';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { MENU } from '@ValenceUI/tokens/menu';
import { POPUP_MOTION } from '@ValenceUI/animations/motion';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import type { FilterMenuProps } from './FilterMenu.types';

/**
 * A filter icon that opens a menu of choices, grouped, where any number can be chosen at once —
 * which is the reason it is not a row of tabs, since a tab can only ever be one thing. Each choice
 * that is in force has a tick at the end of its row, and the menu stays open as choices are made, so
 * several can be picked in one go. How many are chosen is said on the icon, which fills while any
 * are, so a narrowed list is never mistaken for the whole of it. It does not lock the page while it
 * is open, so what is around it can still be read and used.
 *
 * @param label - What is being filtered, read out on opening.
 * @param groups - The choices, in named groups. A group that is single allows one at a time —
 *   choosing another takes the first off — for a choice such as a decade, where two at once would
 *   mean nothing.
 * @param selected - The ids of the choices that are in force.
 * @param hasLabel - Whether the button says "Filters" beside its icon, where it stands on its own
 *   rather than in a strip of icons.
 * @param onChange - Told the ids that are in force after each change.
 */
const FilterMenu = ({ label, groups, selected, hasLabel = false, onChange }: FilterMenuProps) => {
  const portalContainer = usePortalContainer();

  return (
    <RadixMenu.Root modal={false}>
      <RadixMenu.Trigger asChild>
        {hasLabel ? (
          <Button variant="secondary" size="sm" label={label} hasTooltip={false}>
            <Icon
              of={FilterIcon}
              whenActive={FilterFilledIcon}
              isActive={selected.size > 0}
              size={16}
            />
            Filters
            {selected.size === 0 ? null : (
              <Badge tone="solid" size="sm">
                <AnimatedNumber value={selected.size} />
              </Badge>
            )}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" isIconOnly label={label}>
            <span className="relative flex">
              <Icon
                of={FilterIcon}
                whenActive={FilterFilledIcon}
                isActive={selected.size > 0}
                size={18}
              />

              {selected.size === 0 ? null : (
                <Badge tone="solid" size="sm" className="absolute -right-2.5 -top-2.5">
                  <AnimatedNumber value={selected.size} />
                </Badge>
              )}
            </span>
          </Button>
        )}
      </RadixMenu.Trigger>

      <RadixMenu.Portal {...(portalContainer === undefined ? {} : { container: portalContainer })}>
        <RadixMenu.Content
          side="bottom"
          align="end"
          sideOffset={8}
          aria-label={label}
          className={cn(
            'valence-float z-50 flex max-h-96 w-64 flex-col overflow-y-auto rounded-xl p-1.5 text-sm text-text',
            POPUP_MOTION,
          )}
        >
          {groups.map((group) => (
            <RadixMenu.Group key={group.name} aria-label={group.name} className="flex flex-col">
              <RadixMenu.Label className={MENU.label}>{group.name}</RadixMenu.Label>

              {group.options.map((option) => (
                <RadixMenu.CheckboxItem
                  key={option.id}
                  checked={selected.has(option.id)}
                  onSelect={(event) => {
                    event.preventDefault();
                  }}
                  onCheckedChange={(isChecked) => {
                    const next = new Set(selected);

                    if (isChecked) {
                      if (group.isSingle === true) {
                        group.options.forEach((other) => {
                          next.delete(other.id);
                        });
                      }

                      next.add(option.id);
                    } else {
                      next.delete(option.id);
                    }

                    onChange(next);
                  }}
                  className={cn(
                    MENU.item,
                    'justify-between data-[highlighted]:bg-[var(--surface-hover)]',
                    selected.has(option.id) ? 'text-text' : 'text-text-muted',
                  )}
                >
                  <span className="truncate">{option.label}</span>

                  <RadixMenu.ItemIndicator className="flex size-4 shrink-0 items-center justify-center text-text">
                    <Icon of={CheckIcon} size={15} />
                  </RadixMenu.ItemIndicator>
                </RadixMenu.CheckboxItem>
              ))}
            </RadixMenu.Group>
          ))}

          {selected.size === 0 ? null : (
            <>
              <RadixMenu.Separator className="my-1.5 h-px bg-[var(--surface-line)]" />

              <RadixMenu.Item
                className={cn(
                  MENU.item,
                  'text-text-muted data-[highlighted]:bg-[var(--surface-hover)]',
                )}
                onSelect={() => {
                  onChange(new Set());
                }}
              >
                Clear filters
              </RadixMenu.Item>
            </>
          )}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
};

FilterMenu.displayName = 'FilterMenu';

export { FilterMenu };
