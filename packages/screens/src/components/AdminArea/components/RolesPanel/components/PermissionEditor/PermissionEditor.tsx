import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission, Permission } from '@ValenceContracts/schemas/Permission';
import { TextField } from '@ValenceUI/TextField';
import { describePermission } from '@ValenceClient/admin/describePermission';
import { describePermissionDetail } from '@ValenceClient/admin/describePermissionDetail';
import { groupPermissions } from '@ValenceClient/admin/groupPermissions';
import { PermissionRow } from './components/PermissionRow/PermissionRow';
import { PermissionGroup } from './components/PermissionGroup/PermissionGroup';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { ShieldUser as ShieldUserFilledIcon } from '@keyline-icons/react/fill';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';
import type { PermissionEditorProps } from './PermissionEditor.types';
import { say } from '@ValenceI18n/say';

const NO_NODES: PluginContributions['nodes'] = [];

/**
 * Every permission a role can hold, grouped by what it is about and searchable by name — a switch
 * beside a sentence saying what it actually lets somebody do, rather than a flat wall of checkboxes
 * naming an identifier nobody not writing the server would recognise. A permission to ask for
 * something says so where no library takes requests for it, since it lets nobody do anything yet.
 *
 * @param catalogue - Every permission the server knows about.
 * @param pluginNodes - The permissions plugins registered, grouped beneath Valence's own by plugin.
 * @param selected - Which of them this role currently holds.
 * @param onToggle - Told which permission was switched, on or off.
 */
const PermissionEditor = ({
  catalogue,
  pluginNodes = NO_NODES,
  selected,
  onToggle,
}: PermissionEditorProps) => {
  const [search, setSearch] = useState('');
  const requesting = useQuery(requestsQueries.availability());
  const kinds = useRequestableKinds();
  const isRequesting = requesting.data?.isEnabled === true;
  const offeredSources = useQuery({
    ...pluginQueries.contributions(),
    select: (offered) => offered.sources.length,
  });
  const isSourceOffered = (offeredSources.data ?? 0) > 0 && catalogue.includes('requests.ask');
  const hasEverything = selected.includes(ADMINISTRATOR);
  const isWithinEverything = (permission: string) => hasEverything && permission !== ADMINISTRATOR;
  const mine = useQuery(sessionQueries.permissions());
  const isOutOfMyGift = (permission: GrantedPermission) =>
    mine.data !== undefined &&
    !mine.data.isAdministrator &&
    !mine.data.permissions.includes(permission) &&
    !selected.includes(permission);

  const noteOf = (permission: Permission): string | null => {
    if (!isRequesting) {
      return null;
    }

    if (permission === 'requests.askMusic' && !kinds.has('artist') && !kinds.has('album')) {
      return say('screens.rolesPanel.permissionEditor.noMusicLibraryTakesRequests');
    }

    if (permission === 'sources.play' && !hasEverything && !selected.includes('requests.ask')) {
      return say('screens.rolesPanel.permissionEditor.needsRequestFilmsAndSeriesToo');
    }

    return permission === 'requests.ask' &&
      !kinds.has('film') &&
      !kinds.has('series') &&
      !kinds.has('book')
      ? say('screens.rolesPanel.permissionEditor.noLibraryTakesRequests')
      : null;
  };

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const found = groupPermissions(
      isSourceOffered ? catalogue : catalogue.filter((permission) => permission !== 'sources.play'),
    );

    if (query === '') {
      return found;
    }

    return found
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (permission) =>
            describePermission(permission).toLowerCase().includes(query) ||
            describePermissionDetail(permission).toLowerCase().includes(query) ||
            permission.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [catalogue, search, isSourceOffered]);

  const pluginGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = pluginNodes.filter(
      (node) =>
        query === '' ||
        node.title.toLowerCase().includes(query) ||
        (node.description ?? '').toLowerCase().includes(query) ||
        node.pluginName.toLowerCase().includes(query) ||
        node.node.includes(query),
    );

    return [...new Set(matching.map((node) => node.pluginId))].map((pluginId) => ({
      pluginId,
      pluginName: matching.find((node) => node.pluginId === pluginId)?.pluginName ?? pluginId,
      nodes: matching.filter((node) => node.pluginId === pluginId),
    }));
  }, [pluginNodes, search]);

  const rowOf = (permission: Permission) => (
    <PermissionRow
      key={permission}
      label={describePermission(permission)}
      detail={[
        describePermissionDetail(permission),
        isOutOfMyGift(permission)
          ? say('screens.rolesPanel.permissionEditor.youDoNotHaveThisSoYou')
          : noteOf(permission),
      ]
        .filter((part) => part !== null)
        .join(' ')}
      isOn={isWithinEverything(permission) || selected.includes(permission)}
      isDisabled={isWithinEverything(permission) || isOutOfMyGift(permission)}
      onToggle={() => {
        onToggle(permission);
      }}
    />
  );

  const everything = groups.find((group) => group.id === ADMINISTRATOR);
  const rest = groups.filter((group) => group.id !== ADMINISTRATOR);

  const cardOf = (group: (typeof rest)[number]) => (
    <PermissionGroup
      key={group.id}
      heading={group.label}
      heldCount={
        hasEverything
          ? group.permissions.length
          : group.permissions.filter((permission) => selected.includes(permission)).length
      }
      totalCount={group.permissions.length}
    >
      {group.permissions.map(rowOf)}
    </PermissionGroup>
  );

  const adminGroups = rest.filter((group) => group.isAdmin);

  const cards = [
    ...rest.filter((group) => !group.isAdmin).map(cardOf),
    ...pluginGroups.map((group) => (
      <PermissionGroup
        key={group.pluginId}
        heading={say('common.fromPluginName', { pluginName: group.pluginName })}
        heldCount={
          hasEverything
            ? group.nodes.length
            : group.nodes.filter((node) => selected.includes(node.node)).length
        }
        totalCount={group.nodes.length}
      >
        {group.nodes.map((node) => (
          <PermissionRow
            key={node.node}
            label={node.title}
            detail={
              node.description ??
              say('screens.rolesPanel.permissionEditor.letsSomebodyUseThisPartOf', {
                pluginName: group.pluginName,
              })
            }
            isOn={hasEverything || selected.includes(node.node)}
            isDisabled={hasEverything}
            onToggle={() => {
              onToggle(node.node);
            }}
          />
        ))}
      </PermissionGroup>
    )),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pt-4 pb-4">
        <TextField
          label={say('screens.rolesPanel.permissionEditor.searchPermissions')}
          isLabelHidden
          type="search"
          value={search}
          onValueChange={setSearch}
          placeholder={say('screens.rolesPanel.permissionEditor.searchPermissions')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {groups.length === 0 && pluginGroups.length === 0 ? (
          <p className="text-sm text-text-muted">{say('common.nothingHereMatchesThat')}</p>
        ) : null}

        {everything === undefined ? null : (
          <div
            className={cn(
              'mb-5 flex items-center gap-3.5 rounded-xl px-4 py-3.5 ring-1 ring-inset transition-colors duration-[var(--duration-fast)]',
              hasEverything
                ? 'bg-primary/10 ring-primary/40'
                : 'bg-[var(--surface-hover)] ring-[var(--surface-line)]',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                hasEverything
                  ? 'bg-primary/20 text-primary'
                  : 'bg-[var(--surface-active)] text-text-muted',
              )}
            >
              <Icon of={ShieldUserFilledIcon} size={18} tone="inherit" />
            </span>

            <ul className="min-w-0 flex-1 [&>li]:p-0">{everything.permissions.map(rowOf)}</ul>
          </div>
        )}

        {hasEverything && rest.length > 0 ? (
          <p className="mb-4 px-1 text-sm text-text-muted">
            {say('screens.rolesPanel.permissionEditor.everythingIsOnSoEveryPermission')}
          </p>
        ) : null}

        <div
          className={cn(
            'flex flex-col gap-5 transition-opacity duration-[var(--duration-fast)]',
            hasEverything ? 'opacity-70' : '',
          )}
        >
          {cards}

          {adminGroups.length === 0 ? null : (
            <h3 className="mt-3 px-1 text-base font-semibold text-text">
              {say('screens.rolesPanel.permissionEditor.adminPermissions')}
            </h3>
          )}

          {adminGroups.map(cardOf)}
        </div>
      </div>
    </div>
  );
};

PermissionEditor.displayName = 'PermissionEditor';

export { PermissionEditor };
