import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock as LockFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Form } from '@ValenceUI/Form';
import { Icon } from '@ValenceUI/Icon';
import { FormField } from '@ValenceUI/FormField';
import { ScrollRail } from '@ValenceUI/ScrollRail';
import { ROLE_COLOURS } from '@ValenceUI/tokens/roleColours';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { cn } from '@ValenceUI/cn';
import { assignRole, createRole, removeRole, updateRole } from '@ValenceClient/admin/fetchRoles';
import { roleStreamLimit } from '@ValenceClient/admin/roleStreamLimit';
import { saveRoleStreamLimit } from '@ValenceClient/admin/saveRoleStreamLimit';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { holdTheSame } from '@ValenceScreens/admin/holdTheSame';
import { readTypedStreamLimit } from '@ValenceScreens/admin/readTypedStreamLimit';
import { typedStreamLimitOf } from '@ValenceScreens/admin/typedStreamLimitOf';
import { StreamLimitCard } from '@ValenceScreens/components/AdminArea/components/StreamLimitCard/StreamLimitCard';
import type { TypedStreamLimit } from '@ValenceScreens/components/AdminArea/components/StreamLimitCard/StreamLimitCard.types';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import { PermissionEditor } from '@ValenceScreens/components/AdminArea/components/RolesPanel/components/PermissionEditor/PermissionEditor';
import { RoleMembers } from '@ValenceScreens/components/AdminArea/components/RolesPanel/components/RoleMembers/RoleMembers';
import type { RoleEditorProps } from './RoleEditor.types';
import { say } from '@ValenceI18n/say';

const TABS = ['permissions', 'members', 'streaming'] as const;

type Tab = (typeof TABS)[number];

type RoleEdits = {
  name?: string;
  color?: string | null;
  permissions?: readonly GrantedPermission[];
  memberIds?: ReadonlySet<string>;
  limit?: TypedStreamLimit;
};

const NO_ONE: ReadonlySet<string> = new Set();

const NO_PERMISSIONS: readonly GrantedPermission[] = [];

/**
 * Whether a string the tab row handed back names one of the editor's tabs.
 *
 * @param value - What was chosen.
 * @returns Whether it names a tab.
 */
const isTab = (value: string): value is Tab => TABS.some((tab) => tab === value);

/**
 * Whether two typed limits come to the same limit, so a field emptied and typed again is no change.
 *
 * @param one - The first.
 * @param other - The second.
 * @returns Whether they read the same.
 */
const sameLimit = (one: TypedStreamLimit, other: TypedStreamLimit): boolean => {
  const these = readTypedStreamLimit(one);
  const those = readTypedStreamLimit(other);

  return (
    these.maxBitrateKbps !== undefined &&
    these.maxStreams !== undefined &&
    these.maxBitrateKbps === those.maxBitrateKbps &&
    these.maxStreams === those.maxStreams &&
    these.maxQuality === those.maxQuality &&
    these.limitsDownloads === those.limitsDownloads
  );
};

/**
 * One role, opened beside the list of them: what it is called and its colour, what it lets somebody
 * do, who holds it and how much they may stream, each on a tab of the same fixed height, so moving
 * between them never moves the page. Every change is held until it is saved together from the bar
 * that rises once something has changed, or dropped with Reset. A role not yet made is made the
 * same way, and a role at or above the reader's own is shown but cannot be changed.
 *
 * @param role - The role, or null for one being made.
 * @param roles - Every role, for naming the other roles each member holds.
 * @param outOfReach - The roles at or above the reader's own.
 * @param isOutOfReach - Whether the role is at or above the reader's own.
 * @param catalogue - Every permission the server knows about.
 * @param pluginNodes - The permissions plugins registered.
 * @param accounts - Every account, or undefined until they have been read.
 * @param onChange - Told the name as it stands and whether anything is unsaved, after each change.
 * @param onSaved - Told the role's id once it has been saved, or made.
 * @param onCancel - Told when a role being made is abandoned.
 */
const RoleEditor = ({
  role,
  roles,
  outOfReach,
  isOutOfReach,
  catalogue,
  pluginNodes,
  accounts,
  onChange,
  onSaved,
  onCancel,
}: RoleEditorProps) => {
  const cache = useQueryClient();
  const [tab, setTab] = useState<Tab>('permissions');
  const [edits, setEdits] = useState<RoleEdits>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const travel = useTravelDirection([...TABS], tab);
  const isNew = role === null;

  const limitKey = ['admin', 'roleStreamLimit', role?.id ?? ''];
  const askedLimit = useQuery({
    queryKey: limitKey,
    queryFn: () => roleStreamLimit(role?.id ?? ''),
    enabled: !isNew,
  });

  const savedName = role?.name ?? '';
  const savedColor = role?.color ?? null;
  const savedPermissions = role?.permissions ?? NO_PERMISSIONS;
  const savedMemberIds =
    role === null || accounts === undefined
      ? NO_ONE
      : new Set(
          accounts.filter((account) => account.roles.includes(role.name)).map(({ id }) => id),
        );
  const savedLimit = typedStreamLimitOf(askedLimit.data);

  const name = edits.name ?? savedName;
  const color = edits.color === undefined ? savedColor : edits.color;
  const permissions = edits.permissions ?? savedPermissions;
  const memberIds = edits.memberIds ?? savedMemberIds;
  const limit = edits.limit ?? savedLimit;

  const changed = {
    name: name !== savedName,
    color: color !== savedColor,
    permissions: !holdTheSame(permissions, savedPermissions),
    members: !holdTheSame(memberIds, savedMemberIds),
    limit: edits.limit !== undefined && !sameLimit(edits.limit, savedLimit),
  };
  const isChanged = Object.values(changed).some(Boolean);
  const hasBar = !isOutOfReach && (isNew || isChanged);

  useEffect(() => {
    onChange({ name, isChanged });
  }, [onChange, name, isChanged]);

  const edit = (next: RoleEdits) => {
    setEdits((held) => ({ ...held, ...next }));
    setProblem(null);
  };

  /**
   * Saves every change to the role, or makes it, stopping at the first the server refuses.
   *
   * @returns The role's id where it exists, and why the rest could not be saved, or null once it was.
   */
  const save = async (): Promise<{ id: string | null; refused: string | null }> => {
    const id = role?.id ?? null;

    if (name.trim() === '') {
      return { id, refused: say('screens.adminArea.rolesPanel.giveTheRoleAName') };
    }

    const { maxBitrateKbps, maxStreams, maxQuality, limitsDownloads } = readTypedStreamLimit(limit);

    if (maxBitrateKbps === undefined || maxStreams === undefined) {
      setTab('streaming');

      return { id, refused: say('screens.adminArea.accountStreamLimits.notALimit') };
    }

    const read: StreamLimit = { maxBitrateKbps, maxStreams, maxQuality, limitsDownloads };

    if (role === null) {
      const made = await createRole({ name: name.trim(), color, permissions: [...permissions] });

      if (made.role === null) {
        return {
          id: null,
          refused: made.refusal?.message ?? say('client.admin.readRefusal.thatCouldNotBeDoneTry'),
        };
      }

      return { id: made.role.id, refused: await saveRest(made.role.id, read) };
    }

    return { id: role.id, refused: await saveRest(role.id, read) };
  };

  /**
   * Saves what is changed about a role that exists: what it is, who holds it and its limit.
   *
   * @param id - The role.
   * @param read - Its limit, as read from what was typed.
   * @returns Why it could not all be saved, or null once it was.
   */
  const saveRest = async (id: string, read: StreamLimit): Promise<string | null> => {
    if (role !== null && (changed.name || changed.color || changed.permissions)) {
      const refused = await updateRole(id, {
        ...(changed.name ? { name: name.trim() } : {}),
        ...(changed.color ? { color } : {}),
        ...(changed.permissions ? { permissions: [...permissions] } : {}),
      });

      if (refused !== null) {
        return refused.message;
      }
    }

    for (const accountId of memberIds) {
      if (!savedMemberIds.has(accountId)) {
        const refused = await assignRole(accountId, id);

        if (refused !== null) {
          return refused.message;
        }
      }
    }

    for (const accountId of savedMemberIds) {
      if (!memberIds.has(accountId)) {
        const refused = await removeRole(accountId, id);

        if (refused !== null) {
          return refused.message;
        }
      }
    }

    if (changed.limit) {
      const saved = await saveRoleStreamLimit(id, read);

      if (saved === null) {
        return say('screens.adminArea.accountStreamLimits.couldNotSave');
      }

      cache.setQueryData(['admin', 'roleStreamLimit', id], saved);
    }

    return null;
  };

  return (
    <Form
      label={
        isNew
          ? say('screens.adminArea.rolesPanel.createARole')
          : say('common.editName', { name: savedName })
      }
      isDialog
      onSubmit={(event) => {
        event.preventDefault();

        if (!hasBar || isSaving) {
          return;
        }

        setIsSaving(true);
        setProblem(null);

        void save().then(async ({ id, refused }) => {
          await Promise.all([
            cache.invalidateQueries({ queryKey: adminQueries.roles().queryKey }),
            cache.invalidateQueries({ queryKey: adminQueries.accounts().queryKey }),
          ]);

          setIsSaving(false);

          if (isNew && id !== null) {
            tellOutcome(
              say('screens.adminArea.rolesPanel.createdTheNewRoleNameRole', {
                newRoleName: name.trim(),
              }),
              refused,
            );
            onSaved(id);

            return;
          }

          if (refused !== null) {
            setProblem(refused);

            return;
          }

          setEdits({});
          tellOutcome(say('screens.adminArea.rolesPanel.roleSaved'), null);

          if (id !== null) {
            onSaved(id);
          }
        });
      }}
    >
      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (isTab(next)) {
            setTab(next);
          }
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <header className="flex shrink-0 flex-col gap-4 px-5 pt-5">
          {isOutOfReach ? (
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <Icon of={LockFilledIcon} size={13} tone="faint" className="shrink-0" />
              {say('screens.adminArea.rolesPanel.thisRoleIsAtOrAboveYours')}
            </p>
          ) : null}

          <fieldset
            disabled={isOutOfReach}
            className="mb-2 flex min-w-0 flex-wrap items-start gap-x-8 gap-y-4"
          >
            <TextField
              label={say('common.name')}
              value={name}
              placeholder={say('screens.adminArea.rolesPanel.newRole')}
              onValueChange={(next) => {
                edit({ name: next });
              }}
              {...(problem !== null && name.trim() === ''
                ? { error: say('screens.adminArea.rolesPanel.giveTheRoleAName') }
                : {})}
              className="w-full max-w-xs"
            />

            <FormField label={say('common.colour')} className="min-w-0 flex-1">
              <div className="-mt-1.5 -mb-[1.375rem]">
                <ScrollRail className="flex items-center px-1.5 py-1.5">
                  <ColourChoice
                    label={say('common.colour')}
                    value={color ?? ''}
                    presets={ROLE_COLOURS}
                    clear={{
                      isChosen: color === null,
                      onChoose: () => {
                        edit({ color: null });
                      },
                    }}
                    onChange={(next) => {
                      edit({ color: next });
                    }}
                    className="shrink-0 flex-nowrap [&>*]:shrink-0"
                  />
                </ScrollRail>
              </div>
            </FormField>
          </fieldset>

          <TabRow
            label={say('screens.adminArea.rolesPanel.whatToChangeAboutThisRole')}
            tone="underlined"
            size="sm"
            value={tab}
            groups={[
              {
                items: [
                  { id: 'permissions', label: say('screens.adminArea.rolesPanel.permissions') },
                  {
                    id: 'members',
                    label: say('screens.adminArea.rolesPanel.membersMemberCount', {
                      memberCount: memberIds.size.toString(),
                    }),
                  },
                  { id: 'streaming', label: say('client.admin.groupPermissions.streaming') },
                ],
              },
            ]}
          />
        </header>

        <fieldset disabled={isOutOfReach} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TabPanel
            value="permissions"
            travel={travel}
            render={<div className="flex min-h-0 flex-1 flex-col" />}
            className="flex min-h-0 flex-1 flex-col"
          >
            <PermissionEditor
              catalogue={catalogue}
              {...(pluginNodes === undefined ? {} : { pluginNodes })}
              selected={permissions}
              onToggle={(permission) => {
                edit({
                  permissions: permissions.includes(permission)
                    ? permissions.filter((held) => held !== permission)
                    : [...permissions, permission],
                });
              }}
            />
          </TabPanel>

          <TabPanel
            value="members"
            travel={travel}
            render={<div className="flex min-h-0 flex-1 flex-col" />}
            className="flex min-h-0 flex-1 flex-col"
          >
            <RoleMembers
              accounts={accounts ?? []}
              heldIds={memberIds}
              roles={roles}
              roleId={role?.id ?? null}
              outOfReach={outOfReach}
              onToggle={(accountId) => {
                const next = new Set(memberIds);

                if (next.has(accountId)) {
                  next.delete(accountId);
                } else {
                  next.add(accountId);
                }

                edit({ memberIds: next });
              }}
            />
          </TabPanel>

          <TabPanel
            value="streaming"
            travel={travel}
            render={<div className="flex min-h-0 flex-1 flex-col" />}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            <div className="px-5 py-4">
              <StreamLimitCard
                typed={limit}
                onChange={(next) => {
                  edit({ limit: next });
                }}
              >
                <p className="px-1 text-sm text-text-muted">
                  {say('screens.adminArea.roleStreamLimits.everybodyHoldingIt')}
                </p>
              </StreamLimitCard>
            </div>
          </TabPanel>
        </fieldset>

        <AnimatePresence initial={false}>
          {hasBar ? (
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              className="flex shrink-0 flex-wrap items-center gap-3 border-t border-[var(--surface-line)] px-5 py-3"
            >
              <p
                role="status"
                className={cn(
                  'min-w-0 flex-1 text-sm',
                  problem === null ? 'text-text-muted' : 'text-danger',
                )}
              >
                {problem ??
                  (isNew
                    ? say('screens.adminArea.rolesPanel.thisRoleIsNotSavedYet')
                    : say('screens.adminArea.rolesPanel.youHaveUnsavedChanges'))}
              </p>

              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={() => {
                  if (isNew) {
                    onCancel();

                    return;
                  }

                  setEdits({});
                  setProblem(null);
                }}
              >
                {isNew ? say('common.cancel') : say('screens.jobRunner.describeJobGroup.reset')}
              </Button>

              <Button variant="confirm" size="sm" type="submit" isLoading={isSaving}>
                {isNew ? say('screens.adminArea.rolesPanel.createRole') : say('common.saveChanges')}
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Tabs>
    </Form>
  );
};

RoleEditor.displayName = 'RoleEditor';

export { RoleEditor };
