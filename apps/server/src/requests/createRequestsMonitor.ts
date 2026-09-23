import { createReachabilityWatch } from '@ValenceServer/events/createReachabilityWatch';
import { NO_WORK } from '@ValenceContracts/schemas/Requests';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import type { RequestsOverview, RequestsVpn } from '@ValenceContracts/schemas/Requests';
import type { RequestsClient } from '@ValenceServer/requests/createRequestsClient';

type CreateRequestsMonitorOptions = {
  address: string;
  client: Pick<RequestsClient, 'readStatus'>;
  now?: () => Date;
  onLost: (reason: string, problemCode: ProblemCode) => void;
  onRegained: () => void;
  onVpnDown: (reason: string, problemCode: ProblemCode) => void;
  onVpnUp: (vpn: RequestsVpn) => void;
  onIndexerFailing?: (indexer: {
    name: string;
    problem: string;
    problemCode: ProblemCode | null;
  }) => void;
  onIndexerWorking?: (indexer: { name: string }) => void;
};

/**
 * Keeps the server's last word on the requests service, and speaks up when it, or the VPN it
 * downloads through, stops or starts answering.
 *
 * Indexers are judged the same way: the service says which are failing, and each one is spoken of
 * once when it starts and once when it stops.
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
 * @param onIndexerFailing - Told once, with why, when an indexer starts failing.
 * @param onIndexerWorking - Told once when an indexer that was failing stops.
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
  onIndexerFailing = () => undefined,
  onIndexerWorking = () => undefined,
}: CreateRequestsMonitorOptions) => {
  let failingIndexers = new Map<string, string>();
  let latest: RequestsOverview = {
    address,
    isReachable: false,
    problem: null,
    problemCode: null,
    checkedAt: null,
    status: null,
    work: NO_WORK,
  };
  let silence: { reason: string; problemCode: ProblemCode } = {
    reason: '',
    problemCode: 'RequestsUnreachable',
  };
  let lastVpn: RequestsVpn | null = null;

  const service = createReachabilityWatch({
    onLost: () => {
      onLost(silence.reason, silence.problemCode);
    },
    onRegained,
  });

  const vpn = createReachabilityWatch({
    onLost: () => {
      onVpnDown(lastVpn?.problem ?? 'The tunnel is down', lastVpn?.problemCode ?? 'VpnDown');
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
        silence = { reason: reading.reason, problemCode: reading.problemCode };
        latest = {
          address,
          isReachable: false,
          problem: reading.reason,
          problemCode: reading.problemCode,
          checkedAt,
          status: null,
          work: NO_WORK,
        };
        service.record(false);

        return false;
      }

      latest = {
        address,
        isReachable: true,
        problem: null,
        problemCode: null,
        checkedAt,
        status: reading.status,
        work: NO_WORK,
      };
      service.record(true);

      const nowFailing = new Map(
        reading.status.indexers.failing.map((indexer) => [indexer.id, indexer.name]),
      );

      for (const indexer of reading.status.indexers.failing) {
        if (!failingIndexers.has(indexer.id)) {
          onIndexerFailing({
            name: indexer.name,
            problem: indexer.problem,
            problemCode: indexer.problemCode,
          });
        }
      }

      for (const [id, name] of failingIndexers) {
        if (!nowFailing.has(id)) {
          onIndexerWorking({ name });
        }
      }

      failingIndexers = nowFailing;

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
