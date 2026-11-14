import { sayAgain } from '@ValenceI18n/sayAgain';
import {
  Bin as BinIcon,
  Puzzle as PuzzleIcon,
  RotateCcw as RotateCcwIcon,
  Settings as SettingsIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import { TrustBadge } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/TrustBadge/TrustBadge';
import type { InstalledPluginCardProps } from './InstalledPluginCard.types';
import { say } from '@ValenceI18n/say';

const STATES = {
  running: { label: say('common.running'), tone: 'success' },
  idle: { label: say('screens.pluginsPanel.installedPluginCard.ready'), tone: 'success' },
  stopped: { label: say('common.off'), tone: 'ended' },
  failed: { label: say('common.failed'), tone: 'danger' },
  upgrading: { label: say('screens.pluginsPanel.installedPluginCard.updating'), tone: 'busy' },
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
 * @param onRollback - Told to put back the version an upgrade replaced.
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
  onRollback,
  onRemove,
  onOpenPage,
}: InstalledPluginCardProps) => {
  const state = STATES[plugin.state];
  const adminPages = plugin.pages.filter((page) => page.placement === 'admin');

  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center gap-4">
        {plugin.iconUrl === null || !plugin.iconUrl.startsWith('/api/') ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-text-muted">
            <Icon of={PuzzleIcon} size={18} />
          </span>
        ) : (
          <img src={plugin.iconUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[0.9375rem] font-medium text-text">{plugin.name}</span>
            <span className="text-xs tabular-nums text-text-muted">{plugin.version}</span>
            {plugin.trust === 'official' ? null : <TrustBadge trust={plugin.trust} />}
            {plugin.isEnabled ? (
              <Badge size="sm" tone={state.tone}>
                {state.label}
              </Badge>
            ) : (
              <Badge size="sm" tone="ended">
                {say('common.off')}
              </Badge>
            )}
          </div>

          <p className="line-clamp-1 text-xs text-text-muted" title={plugin.description}>
            {plugin.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {plugin.updateAvailable === null ? null : (
            <Button size="sm" variant="confirm" disabled={isBusy} onClick={onUpdate}>
              {say('screens.pluginsPanel.installedPluginCard.updateToUpdateAvailable', {
                updateAvailable: plugin.updateAvailable,
              })}
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

          <Switch
            label={
              plugin.isEnabled
                ? say('common.turnNameOff', { name: plugin.name })
                : say('common.turnNameOn', { name: plugin.name })
            }
            isLabelHidden
            isOn={plugin.isEnabled}
            disabled={isBusy}
            onToggle={onToggle}
          />

          <ActionMenu
            label={say('common.actionsForName', { name: plugin.name })}
            groups={[
              ...(plugin.settings.length === 0 && plugin.webhooks.length === 0
                ? []
                : [
                    {
                      items: [
                        {
                          id: 'settings',
                          label: say('common.settings'),
                          icon: <Icon of={SettingsIcon} size={15} />,
                          onChoose: onSettings,
                        },
                      ],
                    },
                  ]),
              ...(plugin.previousVersion === null
                ? []
                : [
                    {
                      items: [
                        {
                          id: 'rollback',
                          label: say('screens.adminArea.pluginsPanel.rollBackToVersion', {
                            version: plugin.previousVersion,
                          }),
                          icon: <Icon of={RotateCcwIcon} size={15} />,
                          isDisabled: isBusy,
                          onChoose: onRollback,
                        },
                      ],
                    },
                  ]),
              {
                items: [
                  {
                    id: 'remove',
                    label: say('common.forget'),
                    icon: <Icon of={BinIcon} size={15} />,
                    isDestructive: true,
                    isDisabled: isBusy,
                    onChoose: onRemove,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {plugin.problem === null ? null : (
        <Callout
          title={say('screens.pluginsPanel.installedPluginCard.itStoppedWorking')}
          tone="danger"
          className="ms-14"
        >
          {sayAgain(plugin.problem)}
        </Callout>
      )}
    </li>
  );
};

InstalledPluginCard.displayName = 'InstalledPluginCard';

export { InstalledPluginCard };
