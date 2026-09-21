import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { AppliedFiltersProps } from './AppliedFilters.types';

/**
 * What a list is narrowed by, said plainly and one at a time, each with a way to take it off — the
 * counterpart of a filter menu, which says what can be chosen where this says what has been. A
 * list that is narrowed without saying so reads as though it is all there is.
 *
 * Draws nothing while nothing is applied, so the room is not spent on it.
 *
 * @param groups - The choices the list can be narrowed by, in named groups.
 * @param selected - The ids of the choices that are applied.
 * @param onRemove - Told the id of the one whose chip was pressed.
 * @param onClear - Called to take every one off at once.
 */
const AppliedFilters = ({ groups, selected, onRemove, onClear }: AppliedFiltersProps) => {
  const applied = groups.flatMap((group) =>
    group.options
      .filter((option) => selected.has(option.id))
      .map((option) => ({ id: option.id, said: `${group.name}: ${option.label}` })),
  );

  if (applied.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Applied filters" className="flex flex-wrap items-center gap-2">
      {applied.map((filter) => (
        <li key={filter.id}>
          <Button
            variant="glossy"
            size="xs"
            label={`Remove ${filter.said}`}
            hasTooltip={false}
            onClick={() => {
              onRemove(filter.id);
            }}
          >
            {filter.said}
            <Icon of={XIcon} size={13} />
          </Button>
        </li>
      ))}

      <li>
        <Button variant="subtle" size="xs" onClick={onClear}>
          Clear all
        </Button>
      </li>
    </ul>
  );
};

AppliedFilters.displayName = 'AppliedFilters';

export { AppliedFilters };
