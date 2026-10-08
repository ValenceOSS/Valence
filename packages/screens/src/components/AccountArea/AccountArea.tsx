import { motion } from 'motion/react';
import { ApiKeyPanel } from '@ValenceScreens/components/ApiKeyPanel/ApiKeyPanel';
import { HistoryPanel } from '@ValenceScreens/components/HistoryPanel/HistoryPanel';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { ACCOUNT_PANELS } from '@ValenceScreens/components/AccountArea/accountPanels';
import { SettingList } from '@ValenceUI/SettingList';
import { TabPanel } from '@ValenceUI/TabPanel';
import { HiddenPanel } from '@ValenceScreens/components/AccountArea/components/HiddenPanel/HiddenPanel';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { staggerVariants } from '@ValenceUI/animations/reveal';
import { ProfileSettings } from '@ValenceScreens/components/ProfileSettings/ProfileSettings';
import { DiscordSettings } from '@ValenceScreens/components/DiscordSettings/DiscordSettings';
import { canShowOnDiscord } from '@ValenceClient/discord/canShowOnDiscord';
import { TwoFactorSetup } from '@ValenceScreens/components/TwoFactorSetup/TwoFactorSetup';
import { PasskeySetup } from '@ValenceScreens/components/PasskeySetup/PasskeySetup';
import { FirstPassword } from '@ValenceScreens/components/FirstPassword/FirstPassword';
import { DeviceList } from '@ValenceScreens/components/AccountArea/components/DeviceList/DeviceList';
import { SharePanel } from '@ValenceScreens/components/AccountArea/components/SharePanel/SharePanel';
import { PluginSurfaceView } from '@ValenceScreens/components/PluginSurfaceView/PluginSurfaceView';
import type { AccountAreaProps, PluginAccountPage } from './AccountArea.types';
import { say } from '@ValenceI18n/say';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

const PANEL_ORDER: readonly string[] = ACCOUNT_PANELS.map((one) => one.id);

const NO_PAGES: readonly PluginAccountPage[] = [];

/**
 * Somebody's own account: their name and password, the devices they are signed in on, their passkeys
 * and second factor, their API keys, the links they have handed out, and their viewing history.
 *
 * @param user - Whose account it is.
 * @param panel - Which panel is showing, which decides the side a panel arrives from.
 * @param profile - The profile as the server holds it.
 * @param draft - The profile as it would be saved.
 * @param onDraft - Told what somebody changed about it.
 * @param onChanged - Told when something changed, so the shell can read the account again.
 * @param pluginPages - The account pages plugins add, each drawn from the plugin's own building
 *   blocks after Valence's own panels.
 */
const AccountArea = ({
  user,
  panel,
  profile,
  draft,
  onDraft,
  onChanged,
  pluginPages = NO_PAGES,
}: AccountAreaProps) => {
  const { isDemo } = useWhatIMayDo();
  const travel = useTravelDirection([...PANEL_ORDER, ...pluginPages.map((page) => page.id)], panel);

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className="flex w-full flex-col"
    >
      <TabPanel value="profile" className="flex flex-col gap-4" travel={travel}>
        <PanelCard title={say('common.profile')} isFlush>
          <SettingList isInset>
            <ProfileSettings profile={profile} draft={draft} onDraft={onDraft} />
          </SettingList>
        </PanelCard>
      </TabPanel>

      {canShowOnDiscord() ? (
        <TabPanel value="discord" className="flex flex-col gap-4" travel={travel}>
          <DiscordSettings draft={draft} onDraft={onDraft} />
        </TabPanel>
      ) : null}
      <TabPanel value="devices" travel={travel}>
        <DeviceList />
      </TabPanel>

      <TabPanel value="links" travel={travel}>
        <SharePanel />
      </TabPanel>

      <TabPanel value="history" className="flex flex-col gap-4" travel={travel}>
        <PanelCard title={say('common.watchHistory')} isFlush>
          <HistoryPanel />
        </PanelCard>
      </TabPanel>

      <TabPanel value="hidden" travel={travel}>
        <HiddenPanel />
      </TabPanel>

      <TabPanel value="security" className="flex flex-col gap-4" travel={travel}>
        {isDemo ? null : (
          <PanelCard title="Sign-in" isFlush>
            <SettingList isInset>
              <FirstPassword onChanged={onChanged} />

              <TwoFactorSetup isEnabled={user.twoFactorEnabled === true} onChanged={onChanged} />

              <PasskeySetup onChanged={onChanged} />
            </SettingList>
          </PanelCard>
        )}

        <PanelCard title={say('screens.accountArea.aPIKeys')} isFlush>
          <ApiKeyPanel />
        </PanelCard>
      </TabPanel>

      {pluginPages.map((page) => (
        <TabPanel key={page.id} value={page.id} travel={travel}>
          <PanelCard title={say('common.fromPluginName', { pluginName: page.pluginName })}>
            <PluginSurfaceView
              place={{ kind: 'page', pluginId: page.pluginId, pageId: page.pageId }}
            />
          </PanelCard>
        </TabPanel>
      ))}
    </motion.div>
  );
};

AccountArea.displayName = 'AccountArea';

export { AccountArea };
