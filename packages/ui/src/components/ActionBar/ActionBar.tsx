import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';
import type { ActionBarAction, ActionBarProps } from './ActionBar.types';

/**
 * The things a dialog is for: the one worth pressing, the few worth having beside it, and the rest
 * one press away.
 *
 * A dialog for a film can do a dozen things, and a row of a dozen buttons is a wall nobody reads. So
 * the main action keeps the bar, the actions that ask to be pinned sit beside it, and everything
 * else folds into a menu at the end — the same actions, in the same order. On a phone there is no
 * room for the pinned ones either, so they fold in as well.
 *
 * An action with choices of its own is a menu rather than a button: beside the main one it opens
 * them, and folded away they sit in the menu as a group under its name.
 *
 * Both arrangements are drawn and one is hidden, rather than measured and chosen. What to show is a
 * question about width, which CSS already knows the answer to; asking JavaScript means asking again
 * on every resize and being wrong until the first one.
 *
 * @param label - What the folded menu is, read out to anybody who cannot see it.
 * @param primary - The action worth pressing, which keeps the bar at every width.
 * @param actions - Everything else. Those marked pinned sit beside the main one where there is room.
 * @param className - Extra classes for the caller's own layout.
 */
const ActionBar = ({ label, primary, actions, className }: ActionBarProps) => {
  const pinned = actions.filter((action) => action.isPinned === true);
  const folded = actions.filter((action) => action.isPinned !== true);

  const menuOf = (items: readonly ActionBarAction[]): ActionMenuGroup[] =>
    items.reduce<ActionMenuGroup[]>((groups, action) => {
      if (action.choices !== undefined) {
        return [...groups, { name: action.label, items: [...action.choices] }];
      }

      const item = {
        id: action.id,
        label: action.label,
        ...(action.icon === undefined ? {} : { icon: action.icon }),
        onChoose: action.onChoose,
      };
      const last = groups.at(-1);

      return last === undefined || last.name !== undefined
        ? [...groups, { items: [item] }]
        : [...groups.slice(0, -1), { items: [...last.items, item] }];
    }, []);

  return (
    <div className={cn('flex w-full items-center justify-between gap-3', className)}>
      {primary}

      {actions.length === 0 ? null : (
        <>
          <span className="hidden items-center gap-3 sm:flex">
            {pinned.map((action) =>
              action.choices === undefined ? (
                <Button key={action.id} variant="glossy" size="lg" onClick={action.onChoose}>
                  {action.icon}
                  {action.label}
                </Button>
              ) : (
                <ActionMenu
                  key={action.id}
                  label={action.label}
                  align="end"
                  look="raised"
                  className="h-10 w-auto gap-2 px-4 text-sm font-medium"
                  trigger={
                    <>
                      {action.icon}
                      {action.label}
                    </>
                  }
                  groups={[{ items: [...action.choices] }]}
                />
              ),
            )}

            {folded.length === 0 ? null : (
              <ActionMenu
                label={label}
                align="end"
                look="raised"
                className="size-10"
                trigger={<Icon of={MoreHorizontalIcon} size={22} />}
                groups={menuOf(folded)}
              />
            )}
          </span>

          <ActionMenu
            label={label}
            align="end"
            look="raised"
            className="size-10 sm:hidden"
            trigger={<Icon of={MoreHorizontalIcon} size={22} />}
            groups={menuOf(actions)}
          />
        </>
      )}
    </div>
  );
};

ActionBar.displayName = 'ActionBar';

export { ActionBar };
