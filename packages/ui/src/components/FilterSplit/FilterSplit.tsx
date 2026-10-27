import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { filterMenuGroupOf } from '@ValenceUI/filterMenuGroupOf';
import type { FilterSplitProps } from './FilterSplit.types';

/**
 * Filters as one row of joined choices, one to a kind of filter — genre, rating, decade — each
 * opening its own list. A kind that allows several ticks as many as are wanted; one that allows a
 * single answer offers any as well. Each says how many of its own are chosen, so what is narrowed
 * is read without opening anything.
 *
 * @param label - What is being filtered, read out to anybody who cannot see the row.
 * @param scope - A choice of what is filtered at all, such as films or shows, set first and saying
 *   the one in force rather than how many.
 * @param groups - The kinds of filter, each with its choices.
 * @param selected - Every choice in force, across every kind.
 * @param onChange - Told every choice in force once one changes.
 * @param className - Extra classes for the caller's own layout.
 */
const FilterSplit = ({ label, scope, groups, selected, onChange, className }: FilterSplitProps) => (
  <div role="group" aria-label={label} className={cn(JOINED_LOOKS.track, className)}>
    {scope === undefined ? null : (
      <OptionMenu
        label={scope.label}
        triggerShape="segment"
        align="start"
        groups={[
          {
            name: scope.label,
            options: scope.options,
            selectedId: scope.value,
            onSelect: scope.onChange,
          },
        ]}
        trigger={
          <>
            <span className="whitespace-nowrap">
              {scope.options.find((option) => option.id === scope.value)?.label ?? scope.label}
            </span>
            <Icon of={ChevronDownIcon} size={14} tone="muted" className="shrink-0" />
          </>
        }
      />
    )}

    {groups.map((group) => {
      const chosen = group.options.filter((option) => selected.has(option.id));

      return (
        <OptionMenu
          key={group.name}
          label={group.name}
          triggerShape="segment"
          align="start"
          groups={[filterMenuGroupOf(group, selected, onChange)]}
          trigger={
            <>
              <span className="whitespace-nowrap">{group.name}</span>
              {chosen.length === 0 ? null : (
                <Badge tone="bright" size="sm">
                  {chosen.length}
                </Badge>
              )}
              <Icon of={ChevronDownIcon} size={14} tone="muted" className="shrink-0" />
            </>
          }
        />
      );
    })}
  </div>
);

FilterSplit.displayName = 'FilterSplit';

export { FilterSplit };
