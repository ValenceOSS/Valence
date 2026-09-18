import { useMemo, useState } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { describePermission } from '@ValenceClient/admin/describePermission';
import { describePermissionDetail } from '@ValenceClient/admin/describePermissionDetail';
import { groupPermissions } from '@ValenceClient/admin/groupPermissions';
import type { PermissionEditorProps } from './PermissionEditor.types';

/**
 * Every permission a role can hold, grouped by what it is about and searchable by name — a switch
 * beside a sentence saying what it actually lets somebody do, rather than a flat wall of checkboxes
 * naming an identifier nobody not writing the server would recognise.
 *
 * @param catalogue - Every permission the server knows about.
 * @param selected - Which of them this role currently holds.
 * @param onToggle - Told which permission was switched, on or off.
 */
const PermissionEditor = ({ catalogue, selected, onToggle }: PermissionEditorProps) => {
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

  return (
    <div className="flex flex-col gap-6">
      <TextField
        label="Search permissions"
        isLabelHidden
        type="search"
        value={search}
        onValueChange={setSearch}
        placeholder="Search permissions"
        icon={<Icon of={Search01Icon} size={15} />}
      />

      {groups.length === 0 ? (
        <p className="text-sm text-text-muted">Nothing here matches that.</p>
      ) : (
        groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <h4 className="text-base font-semibold text-text">{group.label}</h4>

            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {group.permissions.map((permission) => (
                <li
                  key={permission}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium text-text">
                      {describePermission(permission)}
                    </span>
                    <span className="text-xs leading-relaxed text-text-muted">
                      {describePermissionDetail(permission)}
                    </span>
                  </div>

                  <Switch
                    label={describePermission(permission)}
                    isLabelHidden
                    isOn={selected.includes(permission)}
                    onToggle={() => {
                      onToggle(permission);
                    }}
                    className="mt-0.5 shrink-0"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

PermissionEditor.displayName = 'PermissionEditor';

export { PermissionEditor };
