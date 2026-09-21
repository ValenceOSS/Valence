import { Filter as FilterIcon } from '@keyline-icons/react';
import { Filter as FilterFilledIcon } from '@keyline-icons/react/fill';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import type { FilterMenuProps } from './FilterMenu.types';

/**
 * A filter icon that opens a panel of choices, grouped, where any number can be ticked at once —
 * which is the reason it is not a row of tabs, since a tab can only ever be one thing. How many are
 * ticked is said on the icon, which fills while any are, so a narrowed list is never mistaken for
 * the whole of it.
 *
 * @param label - What is being filtered, read out on opening.
 * @param groups - The choices, in named groups. A group that is single allows one at a time —
 *   ticking another takes the first off — for a choice such as a decade, where two at once would
 *   mean nothing.
 * @param selected - The ids of the choices that are ticked.
 * @param hasLabel - Whether the button says "Filters" beside its icon, where it stands on its own
 *   rather than in a strip of icons.
 * @param onChange - Told the ids that are ticked after each change.
 */
const FilterMenu = ({ label, groups, selected, hasLabel = false, onChange }: FilterMenuProps) => (
  <PopoverPanel
    label={label}
    side="bottom"
    align="end"
    className="w-64"
    triggerLook={hasLabel ? 'button' : 'icon'}
    trigger={
      hasLabel ? (
        <>
          <Icon
            of={FilterIcon}
            whenActive={FilterFilledIcon}
            isActive={selected.size > 0}
            size={16}
          />
          Filters
          {selected.size === 0 ? null : (
            <Badge tone="accent" size="sm">
              <AnimatedNumber value={selected.size} />
            </Badge>
          )}
        </>
      ) : (
        <span className="relative flex">
          <Icon
            of={FilterIcon}
            whenActive={FilterFilledIcon}
            isActive={selected.size > 0}
            size={18}
          />

          {selected.size === 0 ? null : (
            <Badge tone="accent" size="sm" className="absolute -right-2.5 -top-2.5">
              <AnimatedNumber value={selected.size} />
            </Badge>
          )}
        </span>
      )
    }
  >
    <div className="flex flex-col gap-4 p-1">
      {groups.map((group) => (
        <fieldset key={group.name} className="flex flex-col gap-2">
          <legend className="pb-1 text-xs uppercase tracking-[0.16em] text-text-muted">
            {group.name}
          </legend>

          {group.options.map((option) => (
            <Checkbox
              key={option.id}
              label={option.label}
              checked={selected.has(option.id)}
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
            />
          ))}
        </fieldset>
      ))}

      {selected.size === 0 ? null : (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            onChange(new Set());
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  </PopoverPanel>
);

FilterMenu.displayName = 'FilterMenu';

export { FilterMenu };
