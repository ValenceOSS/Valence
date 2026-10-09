import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import { TextField } from '@ValenceUI/TextField';
import { describePermission } from '@ValenceClient/admin/describePermission';
import { describePermissionDetail } from '@ValenceClient/admin/describePermissionDetail';
import { groupPermissions } from '@ValenceClient/admin/groupPermissions';
import { PermissionRow } from './components/PermissionRow/PermissionRow';
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

  const noteOf = (permission: Permission): string | null => {
    if (!isRequesting) {
      return null;
    }

    if (permission === 'requests.askMusic' && !kinds.has('artist') && !kinds.has('album')) {
      return say('screens.rolesPanel.permissionEditor.noMusicLibraryTakesRequests');
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
    const found = groupPermissions(catalogue);

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
  }, [catalogue, search]);

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

  return (
    <div className="flex flex-col gap-6">
      <TextField
        label={say('screens.rolesPanel.permissionEditor.searchPermissions')}
        isLabelHidden
        type="search"
        value={search}
        onValueChange={setSearch}
        placeholder={say('screens.rolesPanel.permissionEditor.searchPermissions')}
      />

      {groups.length === 0 && pluginGroups.length === 0 ? (
        <p className="text-sm text-text-muted">{say('common.nothingHereMatchesThat')}</p>
      ) : (
        groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <h4 className="text-base font-semibold text-text">{group.label}</h4>

            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {group.permissions.map((permission) => (
                <PermissionRow
                  key={permission}
                  label={describePermission(permission)}
                  detail={[describePermissionDetail(permission), noteOf(permission)]
                    .filter((part) => part !== null)
                    .join(' ')}
                  isOn={selected.includes(permission)}
                  onToggle={() => {
                    onToggle(permission);
                  }}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      {pluginGroups.map((group) => (
        <div key={group.pluginId} className="flex flex-col gap-1">
          <h4 className="text-base font-semibold text-text">
            {say('common.fromPluginName', { pluginName: group.pluginName })}
          </h4>

          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
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
                isOn={selected.includes(node.node)}
                onToggle={() => {
                  onToggle(node.node);
                }}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

PermissionEditor.displayName = 'PermissionEditor';

export { PermissionEditor };
