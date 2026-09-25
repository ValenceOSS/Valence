import { docsFor } from '@ValenceCore/functions/docsFor';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import { say } from '@ValenceI18n/say';

type RequestsVpnDescription = {
  label: string;
  tone: BadgeTone;
  detail: string;
  help?: string | null;
};

/**
 * Says how the VPN the requests service downloads through is, as a badge and the line beneath it.
 *
 * @param overview - What the server last heard from the service.
 * @returns The badge's words and tone, and the line to show with it.
 */
const describeRequestsVpn = (overview: RequestsOverview): RequestsVpnDescription => {
  const vpn = overview.status?.vpn ?? null;

  if (vpn === null) {
    return {
      label: say('admin.describeRequestsVpn.unknown'),
      tone: 'quiet',
      detail: say('admin.describeRequestsVpn.unknownDetail'),
    };
  }

  if (!vpn.isConfigured) {
    return {
      label: say('admin.describeRequestsVpn.notSetUp'),
      tone: 'quiet',
      detail: say('admin.describeRequestsVpn.notSetUpDetail'),
    };
  }

  if (vpn.isUp !== true) {
    return {
      label: say('admin.describeRequestsVpn.down'),
      tone: 'danger',
      detail: vpn.problem ?? say('admin.describeRequestsVpn.downDetail'),
      help: docsFor(vpn.problemCode ?? 'VpnDown'),
    };
  }

  const where = [vpn.publicAddress, vpn.country].filter((part) => part !== null);

  return {
    label: say('admin.describeRequestsVpn.up'),
    tone: 'success',
    detail:
      where.length === 0
        ? say('admin.describeRequestsVpn.upDetail')
        : say('admin.describeRequestsVpn.upFrom', { where: where.join(', ') }),
  };
};

export type { RequestsVpnDescription };

export { describeRequestsVpn };
