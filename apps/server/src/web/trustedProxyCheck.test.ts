import { describe, expect, it } from 'vitest';
import { trustedProxyCheck } from './trustedProxyCheck';

describe('trustedProxyCheck', () => {
  const isTrusted = trustedProxyCheck(['127.0.0.0/8', '::1', '172.16.0.0/12', 'fc00::/7']);

  it.each([
    ['loopback', '127.0.0.1'],
    ['a container network', '172.18.0.4'],
    ['IPv6 loopback', '::1'],
    ['a unique local IPv6 address', 'fd12:3456::1'],
  ])('trusts %s', (_what, address) => {
    expect(isTrusted(address)).toBe(true);
  });

  it.each([
    ['an address on the internet', '203.0.113.7'],
    ['an address just outside a range', '172.32.0.1'],
    ['an IPv6 address on the internet', '2001:db8::1'],
    ['something that is not an address', 'proxy.local'],
  ])('does not trust %s', (_what, address) => {
    expect(isTrusted(address)).toBe(false);
  });

  it('trusts nothing when told to trust nothing', () => {
    expect(trustedProxyCheck([])('127.0.0.1')).toBe(false);
  });

  it('stops at a range it cannot read rather than leaving a proxy out', () => {
    expect(() => trustedProxyCheck(['10.0.0.0/99'])).toThrow();
  });
});
