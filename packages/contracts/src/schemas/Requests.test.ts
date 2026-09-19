import { describe, expect, it } from 'vitest';
import {
  NO_WORK,
  RequestsAvailabilitySchema,
  RequestsOverviewSchema,
  RequestsStatusSchema,
} from './Requests';

const A_STATUS = {
  version: '0.4.0',
  vpn: {
    isConfigured: true,
    isUp: true,
    publicAddress: '203.0.113.7',
    country: 'Netherlands',
    checkedAt: '2026-09-19T00:00:00.000Z',
    problem: null,
  },
  indexers: {
    total: 2,
    enabled: 2,
    failing: [
      { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'Jackett', problem: 'Timed out' },
    ],
  },
};

describe('Requests', () => {
  it('reads what the requests service says about itself', () => {
    expect(RequestsStatusSchema.parse(A_STATUS)).toEqual(A_STATUS);
  });

  it('reads a service with no VPN set up, and one too old to say about its indexers', () => {
    const status = {
      version: '0.4.0',
      vpn: {
        isConfigured: false,
        isUp: null,
        publicAddress: null,
        country: null,
        checkedAt: null,
        problem: null,
      },
    };

    expect(RequestsStatusSchema.parse(status)).toEqual({
      ...status,
      indexers: { total: 0, enabled: 0, failing: [] },
    });
  });

  it('reads whether requesting is on at all', () => {
    expect(RequestsAvailabilitySchema.parse({ isEnabled: false })).toEqual({ isEnabled: false });
  });

  it('reads the overview of a service that could not be reached, which has no work to show', () => {
    const overview = {
      address: 'http://requests:8421',
      isReachable: false,
      checkedAt: null,
      status: null,
    };

    expect(RequestsOverviewSchema.parse(overview)).toEqual({ ...overview, work: NO_WORK });
  });

  it('reads what the service is working on', () => {
    const work = {
      awaitingApproval: 2,
      searching: 1,
      downloading: 3,
      failed: 0,
      arrivedToday: 4,
      downloadBytesPerSecond: 12_582_912,
      clients: { total: 2, reachable: 1, failing: [{ name: 'qBittorrent', problem: 'No answer' }] },
    };

    expect(
      RequestsOverviewSchema.parse({
        address: 'http://requests:8421',
        isReachable: true,
        checkedAt: null,
        status: null,
        work,
      }).work,
    ).toEqual(work);
  });
});
