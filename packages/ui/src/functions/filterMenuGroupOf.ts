import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import type { MenuGroup } from '@ValenceUI/OptionMenu.types';
import { say } from '@ValenceI18n/say';

const ANY = '';

/**
 * One kind of filter as a group of a menu: one that allows a single answer offers any as well, and
 * one that allows several ticks as many as are wanted.
 *
 * @param group - The kind of filter, with its choices.
 * @param selected - Every choice in force, across every kind.
 * @param onChange - Told every choice in force once one changes.
 * @returns The group of the menu.
 */
const filterMenuGroupOf = (
  group: FilterGroup,
  selected: ReadonlySet<string>,
  onChange: (next: ReadonlySet<string>) => void,
): MenuGroup => {
  const ownIds = group.options.map((option) => option.id);
  const chosen = ownIds.filter((id) => selected.has(id));
  const others = [...selected].filter((id) => !ownIds.includes(id));
  const options = group.options.map(({ id, label }) => ({ id, label }));

  return group.isSingle === true
    ? {
        name: group.name,
        options: [{ id: ANY, label: say('common.any') }, ...options],
        selectedId: chosen[0] ?? ANY,
        onSelect: (id) => {
          onChange(new Set(id === ANY ? others : [...others, id]));
        },
      }
    : {
        name: group.name,
        options,
        selectedIds: chosen,
        onToggle: (id, isChosen) => {
          const next = new Set(selected);

          if (isChosen) {
            next.add(id);
          } else {
            next.delete(id);
          }

          onChange(next);
        },
      };
};

export { filterMenuGroupOf };
