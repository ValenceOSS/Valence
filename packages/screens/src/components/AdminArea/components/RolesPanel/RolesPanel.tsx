import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus as PlusFilledIcon } from '@keyline-icons/react/fill';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { useRoomBelow } from '@ValenceUI/useRoomBelow';
import { deleteRole, orderRoles } from '@ValenceClient/admin/fetchRoles';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import type { Permission, Role } from '@ValenceContracts/schemas/Permission';
import { RoleEditor } from './components/RoleEditor/RoleEditor';
import { RoleList } from './components/RoleList/RoleList';
import { say } from '@ValenceI18n/say';

const NEW_ROLE = 'new';

const NO_ROLES: Role[] = [];

const NO_IDS: string[] = [];

const NO_PERMISSIONS: Permission[] = [];

/**
 * The roles on this server as Discord lays them out: every role down the side in the order that
 * decides who may manage whom, dragged to rank them, and the chosen one open beside them, where what
 * it is, what it grants, who holds it and its streaming limit are changed and saved together. A role
 * is made the same way, opened at the foot of the list before it is saved.
 */
const RolesPanel = () => {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', isChanged: false });
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const room = useRoomBelow(box, true);
  const cache = useQueryClient();

  const askedRoles = useQuery(adminQueries.roles());
  const askedCatalogue = useQuery(adminQueries.permissions());
  const askedAccounts = useQuery(adminQueries.accounts());
  const askedPlugins = useQuery(pluginQueries.contributions());

  const roles = askedRoles.data?.roles ?? NO_ROLES;
  const outOfReach = useMemo(
    () => new Set(askedRoles.data?.outOfReach ?? NO_IDS),
    [askedRoles.data?.outOfReach],
  );
  const accounts = askedAccounts.data;
  const pluginNodes = askedPlugins.data?.nodes;
  const couldNotRead = askedRoles.isError || askedCatalogue.isError;

  const memberCounts = useMemo(
    () =>
      new Map(
        roles.map((role) => [
          role.id,
          (accounts ?? []).filter((account) => account.roles.includes(role.name)).length,
        ]),
      ),
    [roles, accounts],
  );

  const isMaking = chosenId === NEW_ROLE;
  const chosen = isMaking
    ? null
    : (roles.find((role) => role.id === chosenId) ??
      roles.find((role) => !outOfReach.has(role.id)) ??
      roles[0] ??
      null);
  const openId = isMaking ? NEW_ROLE : (chosen?.id ?? null);

  const onChange = useCallback((next: { name: string; isChanged: boolean }) => {
    setDraft(next);
  }, []);

  const choose = (id: string) => {
    if (id === openId) {
      return;
    }

    if (draft.isChanged) {
      setSwitchingTo(id);

      return;
    }

    setChosenId(id);
  };

  useAdminCommand('createRole', () => {
    choose(NEW_ROLE);
  });

  const putInOrder = async (ids: string[]) => {
    const byId = new Map(roles.map((role) => [role.id, role]));

    cache.setQueryData(adminQueries.roles().queryKey, {
      roles: ids.flatMap((id) => {
        const role = byId.get(id);

        return role === undefined ? [] : [role];
      }),
      outOfReach: [...outOfReach],
    });

    const refusal = await orderRoles(ids);

    tellOutcome(say('screens.adminArea.rolesPanel.rolesPutInOrder'), failureOfRefusal(refusal));
    await cache.invalidateQueries({ queryKey: adminQueries.roles().queryKey });
  };

  return (
    <PanelCard
      title={say('common.roles')}
      isFlush
      actions={
        <PanelCardAction
          icon={PlusFilledIcon}
          onClick={() => {
            choose(NEW_ROLE);
          }}
        >
          {say('screens.adminArea.rolesPanel.createRole')}
        </PanelCardAction>
      }
    >
      {couldNotRead ? (
        <CouldNotRead
          said={say('screens.adminArea.rolesPanel.theRolesCouldNotBeRead')}
          isTryingAgain={askedRoles.isFetching || askedCatalogue.isFetching}
          onTryAgain={() => {
            void askedRoles.refetch();
            void askedCatalogue.refetch();
          }}
        />
      ) : (
        <div
          ref={box}
          style={room === null ? {} : { height: room }}
          className="flex min-h-0 max-md:flex-col"
        >
          {askedRoles.isPending ? (
            <Spinner isCentered size="sm" label={say('common.loading')} />
          ) : (
            <>
              <div className="flex shrink-0 flex-col overflow-y-auto border-[var(--surface-line)] max-md:max-h-56 max-md:border-b md:w-72 md:border-e">
                <p className="px-4 pt-4 pb-1 text-xs text-text-muted">
                  {say('screens.adminArea.rolesPanel.highestFirstDragToReorder')}
                </p>

                <RoleList
                  roles={roles}
                  outOfReach={outOfReach}
                  memberCounts={memberCounts}
                  chosenId={openId}
                  newRoleName={
                    isMaking
                      ? draft.name.trim() === ''
                        ? say('screens.adminArea.rolesPanel.newRole')
                        : draft.name
                      : null
                  }
                  onChoose={choose}
                  onReorder={(ids) => {
                    void putInOrder(ids);
                  }}
                  onDelete={setDeleting}
                />
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {isMaking || chosen !== null ? (
                  <RoleEditor
                    key={openId}
                    role={chosen}
                    roles={roles}
                    outOfReach={outOfReach}
                    isOutOfReach={chosen !== null && outOfReach.has(chosen.id)}
                    catalogue={askedCatalogue.data ?? NO_PERMISSIONS}
                    {...(pluginNodes === undefined ? {} : { pluginNodes })}
                    accounts={accounts}
                    onChange={onChange}
                    onSaved={(id) => {
                      setChosenId(id);
                    }}
                    onCancel={() => {
                      setChosenId(null);
                    }}
                  />
                ) : (
                  <p className="m-auto text-sm text-text-muted">
                    {say('screens.adminArea.rolesPanel.noRolesYet')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        title={say('screens.adminArea.rolesPanel.discardChanges')}
        detail={say('screens.adminArea.rolesPanel.yourChangesToNameHaveNotBeenSaved', {
          name: draft.name.trim() === '' ? say('screens.adminArea.rolesPanel.newRole') : draft.name,
        })}
        confirmLabel={say('screens.adminArea.rolesPanel.discard')}
        isDestructive
        isOpen={switchingTo !== null}
        onClose={() => {
          setSwitchingTo(null);
        }}
        onConfirm={() => {
          setChosenId(switchingTo);
          setSwitchingTo(null);
        }}
      />

      <ConfirmDialog
        title={say('screens.adminArea.rolesPanel.deleteThisRole')}
        detail={
          deleting === null
            ? ''
            : say('screens.adminArea.rolesPanel.nameWillBeRemovedAndAnybody', {
                name: deleting.name,
              })
        }
        confirmLabel={say('screens.adminArea.rolesPanel.deleteRole')}
        isDestructive
        isOpen={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          const role = deleting;

          setDeleting(null);

          if (role === null) {
            return;
          }

          void deleteRole(role.id).then(async (refusal) => {
            tellOutcome(
              say('screens.adminArea.rolesPanel.deletedTheNameRole', { name: role.name }),
              failureOfRefusal(refusal),
            );
            await Promise.all([
              cache.invalidateQueries({ queryKey: adminQueries.roles().queryKey }),
              cache.invalidateQueries({ queryKey: adminQueries.accounts().queryKey }),
            ]);
          });
        }}
      />
    </PanelCard>
  );
};

RolesPanel.displayName = 'RolesPanel';

export { RolesPanel };
