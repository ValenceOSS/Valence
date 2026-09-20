import { describe, expect, it } from 'vitest';
import {
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
};

describe('Requests', () => {
  it('reads what the requests service says about itself', () => {
    expect(RequestsStatusSchema.parse(A_STATUS)).toEqual(A_STATUS);
  });

  it('reads a service with no VPN set up', () => {
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

    expect(RequestsStatusSchema.parse(status)).toEqual(status);
  });

  it('reads whether requesting is on at all', () => {
    expect(RequestsAvailabilitySchema.parse({ isEnabled: false })).toEqual({ isEnabled: false });
  });

  it('reads the overview of a service that could not be reached', () => {
    const overview = {
      address: 'http://requests:8421',
      isReachable: false,
      checkedAt: null,
      status: null,
    };

    expect(RequestsOverviewSchema.parse(overview)).toEqual(overview);
  });
});
