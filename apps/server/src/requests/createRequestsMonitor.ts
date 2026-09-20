import { createReachabilityWatch } from '@ValenceServer/events/createReachabilityWatch';
import type { RequestsOverview, RequestsVpn } from '@ValenceContracts/schemas/Requests';
import type { RequestsClient } from '@ValenceServer/requests/createRequestsClient';

type CreateRequestsMonitorOptions = {
  address: string;
  client: RequestsClient;
  now?: () => Date;
  onLost: (reason: string) => void;
  onRegained: () => void;
  onVpnDown: (reason: string) => void;
  onVpnUp: (vpn: RequestsVpn) => void;
};

/**
 * Keeps the server's last word on the requests service, and speaks up when it, or the VPN it
 * downloads through, stops or starts answering.
 *
 * A VPN is only judged while the service answers — a service nobody can reach says nothing about
 * its tunnel either way — and only where one was set up at all.
 *
 * @param address - Where the service answers, for saying so.
 * @param client - How to ask it.
 * @param now - The clock, for when it was last asked.
 * @param onLost - Told why, once, when the service stops answering.
 * @param onRegained - Told once when it answers again.
 * @param onVpnDown - Told why, once, when the tunnel drops.
 * @param onVpnUp - Told once when it comes back.
 * @returns The monitor: check it, and read what it last found.
 */
const createRequestsMonitor = ({
  address,
  client,
  now = () => new Date(),
  onLost,
  onRegained,
  onVpnDown,
  onVpnUp,
}: CreateRequestsMonitorOptions) => {
  let latest: RequestsOverview = { address, isReachable: false, checkedAt: null, status: null };
  let silence = '';
  let lastVpn: RequestsVpn | null = null;

  const service = createReachabilityWatch({
    onLost: () => {
      onLost(silence);
    },
    onRegained,
  });

  const vpn = createReachabilityWatch({
    onLost: () => {
      onVpnDown(lastVpn?.problem ?? 'The tunnel is down');
    },
    onRegained: () => {
      if (lastVpn !== null) {
        onVpnUp(lastVpn);
      }
    },
  });

  return {
    check: async (): Promise<boolean> => {
      const reading = await client.readStatus();
      const checkedAt = now().toISOString();

      if (reading.kind === 'silent') {
        silence = reading.reason;
        latest = { address, isReachable: false, checkedAt, status: null };
        service.record(false);

        return false;
      }

      latest = { address, isReachable: true, checkedAt, status: reading.status };
      service.record(true);

      if (reading.status.vpn.isConfigured) {
        lastVpn = reading.status.vpn;
        vpn.record(reading.status.vpn.isUp === true);
      }

      return true;
    },
    overview: (): RequestsOverview => latest,
  };
};

type RequestsMonitor = ReturnType<typeof createRequestsMonitor>;

export type { RequestsMonitor };

export { createRequestsMonitor };
