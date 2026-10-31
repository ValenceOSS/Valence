import { AppPasswordSection } from '@ValenceScreens/components/AppPasswordsPanel/components/AppPasswordSection/AppPasswordSection';
import type { AppPasswordsPanelProps } from './AppPasswordsPanel.types';

/**
 * The app passwords this profile made, one part for each plugin that answers apps outside Valence.
 *
 * @param plugins - The plugins that take app passwords.
 */
const AppPasswordsPanel = ({ plugins }: AppPasswordsPanelProps) => (
  <div className="flex flex-col divide-y divide-[var(--surface-line)]">
    {plugins.map((plugin) => (
      <AppPasswordSection
        key={plugin.pluginId}
        pluginId={plugin.pluginId}
        pluginName={plugin.pluginName}
      />
    ))}
  </div>
);

AppPasswordsPanel.displayName = 'AppPasswordsPanel';

export { AppPasswordsPanel };
