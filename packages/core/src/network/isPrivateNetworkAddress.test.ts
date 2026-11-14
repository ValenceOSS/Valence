import { describe, expect, it } from 'vitest';
import { isPrivateNetworkAddress } from './isPrivateNetworkAddress';

describe('isPrivateNetworkAddress', () => {
  it('accepts the ranges of a home or office network', () => {
    for (const address of ['10.1.2.3', '172.16.0.9', '192.168.1.20', 'fd00::1']) {
      expect(isPrivateNetworkAddress(address)).toBe(true);
    }

    expect(isPrivateNetworkAddress('::ffff:192.168.1.20')).toBe(true);
  });

  it('refuses this machine, link-local and metadata addresses, the public internet and non-addresses', () => {
    for (const address of [
      '127.0.0.1',
      '::1',
      '169.254.169.254',
      '100.100.100.200',
      'fe80::1',
      '8.8.8.8',
      '172.32.0.1',
      'nas.lan',
    ]) {
      expect(isPrivateNetworkAddress(address)).toBe(false);
    }
  });
});
