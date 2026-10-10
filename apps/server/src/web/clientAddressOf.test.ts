import { describe, expect, it } from 'vitest';
import { clientAddressOf } from './clientAddressOf';
import { trustedProxyCheck } from './trustedProxyCheck';

const isTrustedProxy = trustedProxyCheck(['127.0.0.0/8', '10.0.0.0/8', '192.168.0.0/16']);

const asked = (forwardedFor: string | null, socketAddress: string | null, realIp?: string) =>
  clientAddressOf({
    headers: new Headers({
      ...(forwardedFor === null ? {} : { 'x-forwarded-for': forwardedFor }),
      ...(realIp === undefined ? {} : { 'x-real-ip': realIp }),
    }),
    socketAddress,
    isTrustedProxy,
  });

describe('clientAddressOf', () => {
  it('takes the connection itself where nothing sits in front of this server', () => {
    expect(asked(null, '203.0.113.7')).toBe('203.0.113.7');
  });

  it('ignores a forwarded chain sent straight from the internet, which anybody can write', () => {
    expect(asked('198.51.100.1', '203.0.113.7')).toBe('203.0.113.7');
  });

  it('believes a trusted proxy about who reached it', () => {
    expect(asked('203.0.113.7', '127.0.0.1')).toBe('203.0.113.7');
  });

  it('reads the chain from its end, so a caller cannot name themselves somebody new', () => {
    expect(asked('198.51.100.1, 203.0.113.7', '127.0.0.1')).toBe('203.0.113.7');
  });

  it('walks back past every proxy it trusts', () => {
    expect(asked('203.0.113.7, 10.0.0.2', '127.0.0.1')).toBe('203.0.113.7');
  });

  it('keeps a caller on the home network who came through the proxy', () => {
    expect(asked('192.168.1.40', '127.0.0.1')).toBe('192.168.1.40');
  });

  it('takes the proxy itself where it forwarded nobody', () => {
    expect(asked(null, '127.0.0.1')).toBe('127.0.0.1');
  });

  it('believes a trusted proxy that names the caller only in x-real-ip', () => {
    expect(asked(null, '192.168.1.5', '203.0.113.7')).toBe('203.0.113.7');
    expect(asked('198.51.100.1', '192.168.1.5', '203.0.113.7')).toBe('198.51.100.1');
  });

  it('ignores x-real-ip from anybody it does not trust, and anything that is not an address', () => {
    expect(asked(null, '203.0.113.9', '198.51.100.1')).toBe('203.0.113.9');
    expect(asked(null, '127.0.0.1', 'unknown')).toBe('127.0.0.1');
  });

  it('unwraps an IPv4 address an IPv6 socket reported in its mapped form', () => {
    expect(asked(null, '::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(asked('203.0.113.7', '::ffff:127.0.0.1')).toBe('203.0.113.7');
  });

  it('cannot tell where a trusted proxy forwarded something that is not an address', () => {
    expect(asked('203.0.113.7, unknown', '127.0.0.1')).toBeNull();
  });

  it('cannot tell without a connection to read', () => {
    expect(asked('203.0.113.7', null)).toBeNull();
  });
});
