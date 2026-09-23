import { describe, expect, it, vi } from 'vitest';
import { NO_WORK } from '@ValenceContracts/schemas/Requests';
import type { RequestsStatus, RequestsVpn } from '@ValenceContracts/schemas/Requests';
import type { RequestsReading } from '@ValenceServer/requests/createRequestsClient';
import { createRequestsMonitor } from './createRequestsMonitor';

const NOW = new Date('2026-09-19T12:00:00.000Z');

/**
 * A VPN that is up, down, or was never set up.
 */
const aVpn = (isUp: boolean | null): RequestsVpn => ({
  isConfigured: isUp !== null,
  isUp,
  publicAddress: isUp === true ? '203.0.113.7' : null,
  country: isUp === true ? 'Netherlands' : null,
  checkedAt: isUp === null ? null : NOW.toISOString(),
  problem: isUp === false ? 'The tunnel is stopped' : null,
  problemCode: isUp === false ? 'VpnDown' : null,
});

/**
 * The service answering, with its VPN as given.
 */
const answered = (isUp: boolean | null): RequestsReading => ({
  kind: 'answered',
  status: {
    version: '0.4.0',
    vpn: aVpn(isUp),
    indexers: { total: 0, enabled: 0, failing: [] },
  } satisfies RequestsStatus,
});

const SILENT: RequestsReading = {
  kind: 'silent',
  reason: 'http://requests:8421 did not answer',
  problemCode: 'RequestsUnreachable',
};

/**
 * A monitor over a service that answers each check with the next reading given.
 */
const aMonitor = (...readings: RequestsReading[]) => {
  const told = {
    onLost: vi.fn(),
    onRegained: vi.fn(),
    onVpnDown: vi.fn(),
    onVpnUp: vi.fn(),
  };
  const monitor = createRequestsMonitor({
    address: 'http://requests:8421',
    client: { readStatus: () => Promise.resolve(readings.shift() ?? SILENT) },
    now: () => NOW,
    ...told,
  });

  return { monitor, ...told };
};

describe('createRequestsMonitor', () => {
  it('knows nothing before its first check', () => {
    const { monitor } = aMonitor();

    expect(monitor.overview()).toEqual({
      address: 'http://requests:8421',
      isReachable: false,
      problem: null,
      problemCode: null,
      checkedAt: null,
      status: null,
      work: NO_WORK,
    });
  });

  it('keeps what the service said about itself', async () => {
    const { monitor } = aMonitor(answered(true));

    expect(await monitor.check()).toBe(true);
    expect(monitor.overview()).toEqual({
      address: 'http://requests:8421',
      isReachable: true,
      problem: null,
      problemCode: null,
      checkedAt: NOW.toISOString(),
      work: NO_WORK,
      status: {
        version: '0.4.0',
        vpn: aVpn(true),
        indexers: { total: 0, enabled: 0, failing: [] },
      },
    });
  });

  it('says why, once, when the service stops answering', async () => {
    const { monitor, onLost } = aMonitor(answered(null), SILENT, SILENT);

    await monitor.check();
    expect(await monitor.check()).toBe(false);
    await monitor.check();

    expect(onLost).toHaveBeenCalledTimes(1);
    expect(onLost).toHaveBeenCalledWith(
      'http://requests:8421 did not answer',
      'RequestsUnreachable',
    );
    expect(monitor.overview()).toMatchObject({
      isReachable: false,
      problem: 'http://requests:8421 did not answer',
      problemCode: 'RequestsUnreachable',
    });
  });

  it('says so when the service answers again', async () => {
    const { monitor, onRegained } = aMonitor(SILENT, answered(null));

    await monitor.check();
    await monitor.check();

    expect(onRegained).toHaveBeenCalledTimes(1);
  });

  it('says why when the tunnel drops, and where it leaves from once it is back', async () => {
    const { monitor, onVpnDown, onVpnUp } = aMonitor(
      answered(true),
      answered(false),
      answered(true),
    );

    await monitor.check();
    await monitor.check();
    await monitor.check();

    expect(onVpnDown).toHaveBeenCalledWith('The tunnel is stopped', 'VpnDown');
    expect(onVpnUp).toHaveBeenCalledWith(aVpn(true));
  });

  it('says a tunnel that is down from the start is down', async () => {
    const { monitor, onVpnDown } = aMonitor(answered(false));

    await monitor.check();

    expect(onVpnDown).toHaveBeenCalledTimes(1);
  });

  it('says a tunnel is down without a reason where gluetun gave none', async () => {
    const { monitor, onVpnDown } = aMonitor({
      kind: 'answered',
      status: {
        version: '0.4.0',
        vpn: { ...aVpn(false), problem: null, problemCode: null },
        indexers: { total: 0, enabled: 0, failing: [] },
      },
    });

    await monitor.check();

    expect(onVpnDown).toHaveBeenCalledWith('The tunnel is down', 'VpnDown');
  });

  it('says nothing about a VPN that was never set up', async () => {
    const { monitor, onVpnDown, onVpnUp } = aMonitor(answered(null), answered(null));

    await monitor.check();
    await monitor.check();

    expect(onVpnDown).not.toHaveBeenCalled();
    expect(onVpnUp).not.toHaveBeenCalled();
  });

  it('judges no tunnel while the service is silent', async () => {
    const { monitor, onVpnDown } = aMonitor(answered(true), SILENT);

    await monitor.check();
    await monitor.check();

    expect(onVpnDown).not.toHaveBeenCalled();
  });

  describe('indexers', () => {
    const JACKETT = {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      name: 'Jackett',
      problem: 'Timed out',
      problemCode: 'CloudflareCheckFailed' as const,
    };

    /**
     * The service answering with these indexers failing.
     */
    const failing = (...indexers: (typeof JACKETT)[]): RequestsReading => ({
      kind: 'answered',
      status: {
        version: '0.4.0',
        vpn: aVpn(null),
        indexers: { total: 2, enabled: 2, failing: indexers },
      },
    });

    const watching = (...readings: RequestsReading[]) => {
      const onIndexerFailing = vi.fn();
      const onIndexerWorking = vi.fn();
      const monitor = createRequestsMonitor({
        address: 'http://requests:8421',
        client: { readStatus: () => Promise.resolve(readings.shift() ?? SILENT) },
        onLost: vi.fn(),
        onRegained: vi.fn(),
        onVpnDown: vi.fn(),
        onVpnUp: vi.fn(),
        onIndexerFailing,
        onIndexerWorking,
      });

      return { monitor, onIndexerFailing, onIndexerWorking };
    };

    it('says once, with why, when an indexer starts failing', async () => {
      const { monitor, onIndexerFailing } = watching(failing(), failing(JACKETT), failing(JACKETT));

      await monitor.check();
      await monitor.check();
      await monitor.check();

      expect(onIndexerFailing).toHaveBeenCalledTimes(1);
      expect(onIndexerFailing).toHaveBeenCalledWith({
        name: 'Jackett',
        problem: 'Timed out',
        problemCode: 'CloudflareCheckFailed',
      });
    });

    it('says once when it stops', async () => {
      const { monitor, onIndexerWorking } = watching(failing(JACKETT), failing(), failing());

      await monitor.check();
      await monitor.check();
      await monitor.check();

      expect(onIndexerWorking).toHaveBeenCalledTimes(1);
      expect(onIndexerWorking).toHaveBeenCalledWith({ name: 'Jackett' });
    });

    it('stays quiet about indexers where nobody is listening', async () => {
      const monitor = createRequestsMonitor({
        address: 'http://requests:8421',
        client: {
          readStatus: vi
            .fn<() => Promise<RequestsReading>>()
            .mockResolvedValueOnce(failing(JACKETT))
            .mockResolvedValueOnce(failing()),
        },
        onLost: vi.fn(),
        onRegained: vi.fn(),
        onVpnDown: vi.fn(),
        onVpnUp: vi.fn(),
      });

      await monitor.check();

      await expect(monitor.check()).resolves.toBe(true);
    });
  });
});
