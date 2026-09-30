import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { docsFor } from '@ValenceCore/functions/docsFor';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import type { RequestsHealth } from './RequestsHealth.types';
import { say } from '@ValenceI18n/say';

/**
 * Says how the VPN the requests service downloads through is, as a badge and the line beneath it.
 *
 * @param overview - What the server last heard from the service.
 * @returns The badge's words and tone, and the line to show with it.
 */
const describeRequestsVpn = (overview: RequestsOverview): RequestsHealth => {
  const vpn = overview.status?.vpn ?? null;

  if (vpn === null) {
    return {
      label: say('common.notChecked'),
      tone: 'quiet',
      detail: say('screens.requestsPanel.describeRequestsVpn.nothingCanBeSaidAboutThe'),
    };
  }

  if (!vpn.isConfigured) {
    return {
      label: say('screens.requestsPanel.describeRequestsVpn.notSetUp'),
      tone: 'quiet',
      detail: say('screens.requestsPanel.describeRequestsVpn.downloadsLeaveFromThisServersOwn'),
    };
  }

  if (vpn.isUp !== true) {
    return {
      label: say('screens.requestsPanel.describeRequestsVpn.down'),
      tone: 'danger',
      detail:
        sayAgainIfAny(vpn.problem) ??
        say('screens.requestsPanel.describeRequestsVpn.theTunnelIsDown'),
      help: docsFor(vpn.problemCode ?? 'VpnDown'),
    };
  }

  const where = [vpn.publicAddress, vpn.country].filter((part) => part !== null);

  return {
    label: say('screens.requestsPanel.describeRequestsVpn.up'),
    tone: 'success',
    detail:
      where.length === 0
        ? say('screens.requestsPanel.describeRequestsVpn.theTunnelIsUp')
        : say('screens.requestsPanel.describeRequestsVpn.theTunnelIsUpAndTraffic', {
            value: where.join(', '),
          }),
  };
};

export { describeRequestsVpn };
