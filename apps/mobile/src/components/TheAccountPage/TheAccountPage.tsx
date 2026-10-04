import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { usePluginWithdrawn } from '@ValenceClient/plugins/usePluginWithdrawn';
import { saidWhenWithdrawn } from '@ValenceClient/plugins/saidWhenWithdrawn';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TheDevices } from '@ValenceMobile/components/TheAccount/components/TheDevices/TheDevices';
import { TheHidden } from '@ValenceMobile/components/TheAccount/components/TheHidden/TheHidden';
import { TheHistory } from '@ValenceMobile/components/TheAccount/components/TheHistory/TheHistory';
import { TheShares } from '@ValenceMobile/components/TheAccount/components/TheShares/TheShares';
import { TheSecurity } from '@ValenceMobile/components/TheAccount/components/TheSecurity/TheSecurity';
import { TheProfile } from '@ValenceMobile/components/TheAccount/components/TheProfile/TheProfile';
import { useAccountPanels } from '@ValenceMobile/components/TheAccount/useAccountPanels';
import { APluginPage } from '@ValenceMobile/components/APluginPage/APluginPage';
import { pluginPageOf } from '@ValenceMobile/plugins/pluginPageOf';
import type { TheAccountPageProps } from './TheAccountPage.types';
import { say } from '@ValenceI18n/say';

/**
 * One part of the account on a page of its own, opened from the account tab, with a way back to it.
 * A plugin's page goes back by itself, saying why, when an administrator turns the plugin off or
 * removes it while it is open.
 *
 * @param panel - Which part, by its panel id.
 * @param onBack - Told to go back to the account tab.
 */
const TheAccountPage = ({ panel, onBack }: TheAccountPageProps) => {
  const panels = useAccountPanels();
  const pluginPage = pluginPageOf(panel);
  const contributions = useQuery(pluginQueries.contributions());
  const pluginName =
    contributions.data?.pages.find((page) => page.pluginId === pluginPage?.pluginId)?.pluginName ??
    say('common.thatPlugin');
  const title = panels.find((one) => one.id === panel)?.label ?? say('common.account');

  usePluginWithdrawn(pluginPage?.pluginId ?? null, (change) => {
    onBack();
    Alert.alert(saidWhenWithdrawn(pluginName, change.change));
  });

  return (
    <Screen scrolls title={title} onBack={onBack}>
      {pluginPage !== null ? (
        <APluginPage key={panel} pluginId={pluginPage.pluginId} pageId={pluginPage.pageId} />
      ) : panel === 'security' ? (
        <TheSecurity />
      ) : panel === 'devices' ? (
        <TheDevices />
      ) : panel === 'history' ? (
        <TheHistory />
      ) : panel === 'hidden' ? (
        <TheHidden />
      ) : panel === 'shares' ? (
        <TheShares />
      ) : (
        <TheProfile />
      )}
    </Screen>
  );
};

TheAccountPage.displayName = 'TheAccountPage';

export { TheAccountPage };
