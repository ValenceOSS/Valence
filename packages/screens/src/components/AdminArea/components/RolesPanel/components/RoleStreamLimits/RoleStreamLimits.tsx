import { useQuery, useQueryClient } from '@tanstack/react-query';
import { roleStreamLimit } from '@ValenceClient/admin/roleStreamLimit';
import { saveRoleStreamLimit } from '@ValenceClient/admin/saveRoleStreamLimit';
import { StreamLimitEditor } from '@ValenceScreens/components/AdminArea/components/StreamLimitEditor/StreamLimitEditor';
import type { RoleStreamLimitsProps } from './RoleStreamLimits.types';
import { say } from '@ValenceI18n/say';

/**
 * The highest bitrate and the most streams at once everybody holding a role may have, which an
 * account's own limit can only make stricter.
 *
 * @param roleId - The role.
 */
const RoleStreamLimits = ({ roleId }: RoleStreamLimitsProps) => {
  const cache = useQueryClient();
  const key = ['admin', 'roleStreamLimit', roleId];
  const held = useQuery({ queryKey: key, queryFn: () => roleStreamLimit(roleId) });

  return (
    <StreamLimitEditor
      own={held.data}
      onSave={async (limit) => {
        const saved = await saveRoleStreamLimit(roleId, limit);

        if (saved !== null) {
          cache.setQueryData(key, saved);
        }

        return saved !== null;
      }}
    >
      <p className="text-sm text-text-muted">
        {say('screens.adminArea.roleStreamLimits.everybodyHoldingIt')}
      </p>
    </StreamLimitEditor>
  );
};

RoleStreamLimits.displayName = 'RoleStreamLimits';

export { RoleStreamLimits };
