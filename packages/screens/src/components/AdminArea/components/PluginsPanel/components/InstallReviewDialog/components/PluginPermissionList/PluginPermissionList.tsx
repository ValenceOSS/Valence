import { describePermission } from '@ValenceClient/plugins/describePermission';
import { say } from '@ValenceI18n/say';
import type { PluginPermissionListProps } from './PluginPermissionList.types';

/**
 * What a plugin will be allowed to do once it is installed, each permission in plain words.
 *
 * @param permissions - What the plugin asks for.
 */
const PluginPermissionList = ({ permissions }: PluginPermissionListProps) => (
  <section className="flex flex-col gap-2">
    <h3 className="text-sm font-medium text-text-muted">
      {say('screens.pluginsPanel.installReviewDialog.itWillBeAllowedTo')}
    </h3>

    {permissions.length === 0 ? (
      <p className="text-sm text-text-muted">
        {say('screens.pluginsPanel.installReviewDialog.nothingBeyondDrawingItsOwnPages')}
      </p>
    ) : (
      <ul className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/60">
        {permissions.map((permission) => {
          const said = describePermission(permission);

          return (
            <li key={permission.kind} className="flex flex-col gap-0.5 px-3 py-2.5">
              <span className="text-sm font-medium text-text">{said.title}</span>
              <span className="text-xs leading-relaxed text-text-muted">{said.detail}</span>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

PluginPermissionList.displayName = 'PluginPermissionList';

export { PluginPermissionList };
