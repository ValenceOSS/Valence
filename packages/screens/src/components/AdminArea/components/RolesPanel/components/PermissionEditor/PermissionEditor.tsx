import { useMemo, useState } from 'react';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { describePermission } from '@ValenceClient/admin/describePermission';
import { describePermissionDetail } from '@ValenceClient/admin/describePermissionDetail';
import { groupPermissions } from '@ValenceClient/admin/groupPermissions';
import { PermissionRow } from './components/PermissionRow/PermissionRow';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';
import type { PermissionEditorProps } from './PermissionEditor.types';

const NO_NODES: PluginContributions['nodes'] = [];

/**
 * Every permission a role can hold, grouped by what it is about and searchable by name — a switch
 * beside a sentence saying what it actually lets somebody do, rather than a flat wall of checkboxes
 * naming an identifier nobody not writing the server would recognise.
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
        label="Search permissions"
        isLabelHidden
        type="search"
        value={search}
        onValueChange={setSearch}
        placeholder="Search permissions"
        icon={<Icon of={SearchIcon} size={15} />}
      />

      {groups.length === 0 && pluginGroups.length === 0 ? (
        <p className="text-sm text-text-muted">Nothing here matches that.</p>
      ) : (
        groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <h4 className="text-base font-semibold text-text">{group.label}</h4>

            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {group.permissions.map((permission) => (
                <PermissionRow
                  key={permission}
                  label={describePermission(permission)}
                  detail={describePermissionDetail(permission)}
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
          <h4 className="text-base font-semibold text-text">{`From ${group.pluginName}`}</h4>

          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {group.nodes.map((node) => (
              <PermissionRow
                key={node.node}
                label={node.title}
                detail={node.description ?? `Lets somebody use this part of ${group.pluginName}.`}
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
