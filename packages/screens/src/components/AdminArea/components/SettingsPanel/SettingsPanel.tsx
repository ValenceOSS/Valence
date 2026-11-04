import { PreRollCard } from '@ValenceScreens/components/AdminArea/components/PreRollCard/PreRollCard';
import { ServerCard } from './components/ServerCard/ServerCard';
import { SignInCard } from './components/SignInCard/SignInCard';
import { OnlineServicesCard } from './components/OnlineServicesCard/OnlineServicesCard';
import type { SettingsPanelProps } from './SettingsPanel.types';

/**
 * The server's own settings, a card for each part: the server itself, the screen people sign in
 * from, everything it reaches online, and the clip played before a title. Every setting saves as it
 * is changed.
 *
 * @param overview - What the server reports about itself, or null before it has answered.
 */
const SettingsPanel = ({ overview }: SettingsPanelProps) => (
  <div className="flex flex-col gap-4">
    <ServerCard overview={overview} />
    <SignInCard overview={overview} />
    <OnlineServicesCard overview={overview} />
    <PreRollCard />
  </div>
);

SettingsPanel.displayName = 'SettingsPanel';

export { SettingsPanel };
