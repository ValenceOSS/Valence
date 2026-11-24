import { useState } from 'react';
import { Reorder } from 'motion/react';
import {
  ArrowDown as ArrowDownFilledIcon,
  ArrowUp as ArrowUpFilledIcon,
  Bin as BinFilledIcon,
  GripVertical as GripVerticalIcon,
  Lock as LockFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { Role } from '@ValenceContracts/schemas/Permission';
import { RoleFace } from './components/RoleFace/RoleFace';
import { MovableRole } from './components/MovableRole/MovableRole';
import type { RoleListProps } from './RoleList.types';
import { say } from '@ValenceI18n/say';

/**
 * Every role, highest first, as the order that decides who may manage whom: a role is dragged to
 * where it ranks, or moved a place at a time from its menu. Roles at or above the reader's own stay
 * at the top with a lock, since they are not the reader's to move or change.
 *
 * @param roles - Every role, highest first.
 * @param outOfReach - The roles at or above the reader's own.
 * @param memberCounts - How many hold each role.
 * @param chosenId - The role open beside the list.
 * @param newRoleName - What a role being made is called so far, or null where none is.
 * @param onChoose - Told which role was pressed.
 * @param onReorder - Told every role, highest first, once one has been moved.
 * @param onDelete - Told which role somebody asked to delete.
 */
const RoleList = ({
  roles,
  outOfReach,
  memberCounts,
  chosenId,
  newRoleName,
  onChoose,
  onReorder,
  onDelete,
}: RoleListProps) => {
  const fixed = roles.filter((role) => outOfReach.has(role.id));
  const movable = roles.filter((role) => !outOfReach.has(role.id));
  const [dragOrder, setDragOrder] = useState<{ from: string; ids: string[] } | null>(null);
  const given = movable.map((role) => role.id).join(' ');
  const order =
    dragOrder !== null && dragOrder.from === given ? dragOrder.ids : movable.map((role) => role.id);
  const byId = new Map(roles.map((role) => [role.id, role]));

  const settle = (ids: readonly string[]) => {
    setDragOrder(null);

    if (ids.join(' ') !== given) {
      onReorder([...fixed.map((role) => role.id), ...ids]);
    }
  };

  const move = (id: string, by: number) => {
    const at = order.indexOf(id);
    const next = [...order];

    next.splice(at, 1);
    next.splice(at + by, 0, id);
    settle(next);
  };

  const menuOf = (role: Role, at: number) => (
    <span
      data-role-menu
      className={cn(
        'shrink-0 transition-opacity duration-[var(--duration-fast)]',
        chosenId === role.id
          ? ''
          : 'opacity-0 focus-within:opacity-100 group-hover/role:opacity-100 has-[[data-state=open]]:opacity-100',
      )}
    >
      <ActionMenu
        label={say('common.actionsForName', { name: role.name })}
        groups={[
          {
            items: [
              {
                id: 'up',
                label: say('common.moveUp'),
                icon: <Icon of={ArrowUpFilledIcon} size={15} />,
                isDisabled: at === 0,
                onChoose: () => {
                  move(role.id, -1);
                },
              },
              {
                id: 'down',
                label: say('common.moveDown'),
                icon: <Icon of={ArrowDownFilledIcon} size={15} />,
                isDisabled: at === order.length - 1,
                onChoose: () => {
                  move(role.id, 1);
                },
              },
            ],
          },
          {
            items: [
              {
                id: 'delete',
                label: say('screens.adminArea.rolesPanel.deleteRole'),
                icon: <Icon of={BinFilledIcon} size={15} />,
                isDestructive: true,
                isDisabled: role.permissions.includes(ADMINISTRATOR),
                ...(role.permissions.includes(ADMINISTRATOR)
                  ? {
                      detail: say(
                        'screens.adminArea.rolesPanel.rolesWithEveryPermissionCannotBeDeleted',
                      ),
                    }
                  : {}),
                onChoose: () => {
                  onDelete(role);
                },
              },
            ],
          },
        ]}
      />
    </span>
  );

  return (
    <div className="flex flex-col p-2">
      {fixed.length === 0 ? null : (
        <ol aria-label={say('screens.adminArea.rolesPanel.rolesAboveYours')}>
          {fixed.map((role) => (
            <li key={role.id}>
              <RoleFace
                name={role.name}
                color={role.color}
                grantsEverything={role.permissions.includes(ADMINISTRATOR)}
                memberCount={memberCounts.get(role.id) ?? 0}
                isChosen={chosenId === role.id}
                lead={
                  <Icon
                    of={LockFilledIcon}
                    size={12}
                    tone="faint"
                    label={say('screens.adminArea.rolesPanel.aboveYourRole')}
                  />
                }
                menu={null}
                onChoose={() => {
                  onChoose(role.id);
                }}
              />
            </li>
          ))}
        </ol>
      )}

      <Reorder.Group
        as="ol"
        axis="y"
        values={order}
        onReorder={(ids: string[]) => {
          setDragOrder({ from: given, ids });
        }}
        aria-label={say('screens.adminArea.rolesPanel.rolesHighestFirst')}
        className="relative flex flex-col"
      >
        {order.map((id, at) => {
          const role = byId.get(id);

          return role === undefined ? null : (
            <MovableRole
              key={id}
              role={role}
              onDragEnd={() => {
                if (dragOrder !== null) {
                  settle(dragOrder.ids);
                }
              }}
            >
              <RoleFace
                name={role.name}
                color={role.color}
                grantsEverything={role.permissions.includes(ADMINISTRATOR)}
                memberCount={memberCounts.get(role.id) ?? 0}
                isChosen={chosenId === role.id}
                lead={
                  <span data-role-grip className="flex touch-none">
                    <Icon
                      of={GripVerticalIcon}
                      size={14}
                      tone="faint"
                      className="opacity-40 transition-opacity group-hover/role:opacity-100"
                    />
                  </span>
                }
                menu={menuOf(role, at)}
                onChoose={() => {
                  onChoose(role.id);
                }}
              />
            </MovableRole>
          );
        })}
      </Reorder.Group>

      {newRoleName === null ? null : (
        <RoleFace
          name={newRoleName}
          color={null}
          grantsEverything={false}
          memberCount={null}
          isChosen
          lead={null}
          menu={null}
          onChoose={() => {}}
        />
      )}
    </div>
  );
};

RoleList.displayName = 'RoleList';

export { RoleList };
