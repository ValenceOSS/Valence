import { Plug as PlugIcon, Settings as SettingsIcon, Bin as BinIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import type { InstalledPluginCardProps } from './InstalledPluginCard.types';

const STATES = {
  running: { label: 'Running', tone: 'success' },
  idle: { label: 'Ready', tone: 'quiet' },
  stopped: { label: 'Off', tone: 'quiet' },
  failed: { label: 'Failed', tone: 'danger' },
} as const;

/**
 * One installed plugin: what it is, whether Valence vouches for it, how it is getting on, and the
 * controls to turn it off, change its settings, update it, open the pages it adds for
 * administrators, or remove it.
 *
 * @param plugin - The plugin.
 * @param isBusy - Whether something is being done to it.
 * @param onToggle - Told to turn it on or off.
 * @param onSettings - Told to open its settings.
 * @param onUpdate - Told to fetch the newer version from the catalogue.
 * @param onRemove - Told to remove it.
 * @param onOpenPage - Told to open one of its administrator pages.
 */
const InstalledPluginCard = ({
  plugin,
  isBusy,
  onToggle,
  onSettings,
  onUpdate,
  onRemove,
  onOpenPage,
}: InstalledPluginCardProps) => {
  const state = STATES[plugin.state];
  const adminPages = plugin.pages.filter((page) => page.placement === 'admin');

  return (
    <li className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-start gap-3">
        {plugin.iconUrl === null || !plugin.iconUrl.startsWith('/api/') ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-text-muted">
            <Icon of={PlugIcon} size={18} />
          </span>
        ) : (
          <img src={plugin.iconUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-text">{plugin.name}</span>
            <span className="text-xs text-text-muted">{plugin.version}</span>
            <Badge size="sm" tone={plugin.trust === 'official' ? 'success' : 'warning'}>
              {plugin.trust === 'official' ? 'Official' : 'Not signed'}
            </Badge>
            {plugin.isEnabled ? (
              <Badge size="sm" tone={state.tone}>
                {state.label}
              </Badge>
            ) : null}
          </div>

          <p className="text-xs leading-relaxed text-text-muted">{plugin.description}</p>
          <p className="text-xs text-text-muted/80">By {plugin.author}</p>
        </div>

        <Switch
          label={plugin.isEnabled ? `Turn ${plugin.name} off` : `Turn ${plugin.name} on`}
          isLabelHidden
          isOn={plugin.isEnabled}
          disabled={isBusy}
          onToggle={onToggle}
        />
      </div>

      {plugin.problem === null ? null : (
        <Callout title="It stopped working" tone="danger">
          {plugin.problem}
        </Callout>
      )}

      <div className="flex flex-wrap gap-2">
        {plugin.updateAvailable === null ? null : (
          <Button size="sm" variant="confirm" disabled={isBusy} onClick={onUpdate}>
            Update to {plugin.updateAvailable}
          </Button>
        )}

        {adminPages.map((page) => (
          <Button
            key={page.id}
            size="sm"
            variant="secondary"
            onClick={() => {
              onOpenPage({ pageId: page.id, title: page.title });
            }}
          >
            {page.title}
          </Button>
        ))}

        {plugin.settings.length === 0 ? null : (
          <Button size="sm" variant="secondary" onClick={onSettings}>
            <Icon of={SettingsIcon} size={14} />
            Settings
          </Button>
        )}

        <Button size="sm" variant="ghost" disabled={isBusy} onClick={onRemove}>
          <Icon of={BinIcon} size={14} />
          Remove
        </Button>
      </div>
    </li>
  );
};

InstalledPluginCard.displayName = 'InstalledPluginCard';

export { InstalledPluginCard };
