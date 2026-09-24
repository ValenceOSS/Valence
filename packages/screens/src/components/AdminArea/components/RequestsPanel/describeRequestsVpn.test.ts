import { describe, expect, it } from 'vitest';
import { NO_WORK } from '@ValenceContracts/schemas/Requests';
import { describeRequestsVpn } from './describeRequestsVpn';
import type { RequestsOverview, RequestsVpn } from '@ValenceContracts/schemas/Requests';

const A_VPN: RequestsVpn = {
  isConfigured: true,
  isUp: true,
  publicAddress: '203.0.113.7',
  country: 'Netherlands',
  checkedAt: '2026-09-19T12:00:00.000Z',
  problem: null,
  problemCode: null,
};

/**
 * What the server heard from a service whose VPN is as given.
 */
const hearing = (vpn: RequestsVpn | null): RequestsOverview => ({
  address: 'http://requests:8421',
  isReachable: vpn !== null,
  problem: null,
  problemCode: null,
  checkedAt: '2026-09-19T12:00:00.000Z',
  status:
    vpn === null
      ? null
      : { version: '0.4.0', vpn, indexers: { total: 0, enabled: 0, failing: [] } },
  work: NO_WORK,
});

describe('describeRequestsVpn', () => {
  it('says where traffic leaves from while the tunnel is up', () => {
    expect(describeRequestsVpn(hearing(A_VPN))).toEqual({
      label: 'Up',
      tone: 'success',
      detail: 'The tunnel is up, and traffic leaves from 203.0.113.7, Netherlands.',
    });
  });

  it('says the tunnel is up without saying where, where that is not known yet', () => {
    expect(
      describeRequestsVpn(hearing({ ...A_VPN, publicAddress: null, country: null })).detail,
    ).toBe('The tunnel is up.');
  });

  it('says why the tunnel is down', () => {
    expect(
      describeRequestsVpn(
        hearing({ ...A_VPN, isUp: false, problem: 'The tunnel is stopped', problemCode: null }),
      ),
    ).toEqual({
      label: 'Down',
      tone: 'danger',
      detail: 'The tunnel is stopped',
      help: 'https://docs.getvalence.app/install/requesting#the-vpn-is-down',
    });
  });

  it('still says the tunnel is down where no reason was given', () => {
    expect(describeRequestsVpn(hearing({ ...A_VPN, isUp: false })).detail).toBe(
      'The tunnel is down.',
    );
  });

  it('says how to set one up where there is none', () => {
    const said = describeRequestsVpn(hearing({ ...A_VPN, isConfigured: false, isUp: null }));

    expect(said.label).toBe('Not set up');
    expect(said.detail).toContain('VPN_URL');
  });

  it('says nothing can be known while the service is silent', () => {
    expect(describeRequestsVpn(hearing(null)).label).toBe('Unknown');
  });
});
