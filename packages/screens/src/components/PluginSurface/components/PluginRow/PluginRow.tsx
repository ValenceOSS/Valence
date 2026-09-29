import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { pluginImageUrl } from '@ValenceClient/plugins/pluginImageUrl';
import { glyphFor } from '@ValenceSDK/surface/glyphFor';
import { PLUGIN_ICONS } from '@ValenceScreens/components/PluginSurface/PLUGIN_ICONS';
import type { PluginRowProps } from './PluginRow.types';

/**
 * One line of a plugin's page: a picture or an icon, what it is and a line about it, a badge at the
 * end, and pressable where the plugin gave it something to do.
 *
 * @param pluginId - The plugin that drew it.
 * @param row - The row.
 * @param onAct - Told the row was pressed.
 * @param isActing - Whether the plugin is still answering the last press.
 */
const PluginRow = ({ pluginId, row, onAct, isActing }: PluginRowProps) => {
  const inside = (
    <span className="flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left">
      {row.image === undefined ? (
        row.icon === undefined ? null : (
          <Icon of={glyphFor(PLUGIN_ICONS, row.icon)} size={18} tone="muted" className="shrink-0" />
        )
      ) : (
        <img
          src={pluginImageUrl(pluginId, row.image)}
          alt=""
          loading="lazy"
          className="size-10 shrink-0 rounded-md object-cover"
        />
      )}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-text">{row.label}</span>

        {row.detail === undefined ? null : (
          <span className="truncate text-xs text-text-muted">{row.detail}</span>
        )}
      </span>

      {row.badge === undefined ? null : <Badge size="sm">{row.badge}</Badge>}
    </span>
  );

  const action = row.action;

  return action === undefined ? (
    <div className="flex">{inside}</div>
  ) : (
    <Button
      variant="row"
      size="none"
      disabled={isActing}
      onClick={() => {
        onAct(action);
      }}
    >
      {inside}
    </Button>
  );
};

PluginRow.displayName = 'PluginRow';

export { PluginRow };
