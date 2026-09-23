import { docsFor } from '@ValenceCore/functions/docsFor';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';

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
      label: 'Unknown',
      tone: 'quiet',
      detail: 'Nothing can be said about the VPN until the requests service answers.',
    };
  }

  if (!vpn.isConfigured) {
    return {
      label: 'Not set up',
      tone: 'quiet',
      detail:
        'Downloads leave from this server’s own address. Set VPN_URL on the requests service to send them through gluetun.',
    };
  }

  if (vpn.isUp !== true) {
    return {
      label: 'Down',
      tone: 'danger',
      detail: vpn.problem ?? 'The tunnel is down.',
      help: docsFor(vpn.problemCode ?? 'VpnDown'),
    };
  }

  const where = [vpn.publicAddress, vpn.country].filter((part) => part !== null);

  return {
    label: 'Up',
    tone: 'success',
    detail:
      where.length === 0
        ? 'The tunnel is up.'
        : `The tunnel is up, and traffic leaves from ${where.join(', ')}.`,
  };
};

export type { RequestsVpnDescription };

export { describeRequestsVpn };
