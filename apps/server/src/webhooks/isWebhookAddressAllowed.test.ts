import { describe, expect, it } from 'vitest';
import { isWebhookAddressAllowed } from './isWebhookAddressAllowed';

describe('isWebhookAddressAllowed', () => {
  it.each([
    '169.254.169.254',
    'fe80::1',
    '::ffff:169.254.169.254',
    'fd00:ec2::254',
    '100.100.100.200',
  ])('refuses %s whatever the setting', (address) => {
    expect(isWebhookAddressAllowed(address, false)).toBe(false);
    expect(isWebhookAddressAllowed(address, true)).toBe(false);
  });

  it.each(['127.0.0.1', '::1', '10.0.0.5', '172.17.0.2', '192.168.1.20', '100.64.0.1', 'fd12::1'])(
    'refuses %s unless the local network is allowed',
    (address) => {
      expect(isWebhookAddressAllowed(address, false)).toBe(false);
      expect(isWebhookAddressAllowed(address, true)).toBe(true);
    },
  );

  it('allows a mapped private address only with the local network allowed', () => {
    expect(isWebhookAddressAllowed('::ffff:10.0.0.5', false)).toBe(false);
    expect(isWebhookAddressAllowed('::ffff:10.0.0.5', true)).toBe(true);
  });

  it.each(['93.184.216.34', '2606:4700:4700::1111'])('allows public address %s', (address) => {
    expect(isWebhookAddressAllowed(address, false)).toBe(true);
  });

  it('refuses something that is not an address', () => {
    expect(isWebhookAddressAllowed('example.com', true)).toBe(false);
  });
});
