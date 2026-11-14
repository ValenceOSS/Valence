import { describe, expect, it } from 'vitest';
import { refusalOfWebhookAddress } from './refusalOfWebhookAddress';

describe('refusalOfWebhookAddress', () => {
  it('allows a public address, and a private one where the local network is on', () => {
    expect(refusalOfWebhookAddress(['93.184.216.34'], false)).toBeNull();
    expect(refusalOfWebhookAddress(['192.168.1.20'], true)).toBeNull();
    expect(refusalOfWebhookAddress([], false)).toBeNull();
  });

  it('points at the Local network switch for a private address while it is off', () => {
    expect(refusalOfWebhookAddress(['192.168.1.20'], false)).toBe(
      'error.webhook.valenceWillNotSendToTheLocalNetwork',
    );
    expect(refusalOfWebhookAddress(['93.184.216.34', '::1'], false)).toBe(
      'error.webhook.valenceWillNotSendToTheLocalNetwork',
    );
  });

  it('refuses a link-local address outright, whatever the switch says', () => {
    expect(refusalOfWebhookAddress(['169.254.169.254'], true)).toBe(
      'error.common.valenceWillNotSendDeliveriesTo',
    );
    expect(refusalOfWebhookAddress(['169.254.169.254'], false)).toBe(
      'error.common.valenceWillNotSendDeliveriesTo',
    );
  });
});
