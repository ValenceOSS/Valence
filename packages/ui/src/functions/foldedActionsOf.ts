import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';
import type { ActionBarAction } from '@ValenceUI/ActionBar.types';

/**
 * Lays actions out as the groups of a menu they have been folded into: plain actions run together
 * in one group, and an action with choices of its own becomes a group under its name. An action
 * that is on stays marked as on, and one that cannot be done stays unavailable.
 *
 * @param actions - The actions folded away, in order.
 * @returns The groups, for an action menu.
 */
const foldedActionsOf = (actions: readonly ActionBarAction[]): ActionMenuGroup[] =>
  actions.reduce<ActionMenuGroup[]>((groups, action) => {
    if (action.choices !== undefined) {
      return [...groups, { name: action.label, items: [...action.choices] }];
    }

    const item = {
      id: action.id,
      label: action.label,
      ...(action.icon === undefined ? {} : { icon: action.icon }),
      ...(action.isDisabled === true ? { isDisabled: true } : {}),
      ...(action.isChosen === true ? { isCurrent: true } : {}),
      onChoose: action.onChoose,
    };
    const last = groups.at(-1);

    return last === undefined || last.name !== undefined
      ? [...groups, { items: [item] }]
      : [...groups.slice(0, -1), { items: [...last.items, item] }];
  }, []);

export { foldedActionsOf };
