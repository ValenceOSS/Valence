import { describe, expect, it } from 'vitest';
import { readCallerAddress } from './readCallerAddress';

const asked = (sent: Record<string, string>, socketAddress: string | null = null) =>
  readCallerAddress({ headers: new Headers(sent), socketAddress });

describe('readCallerAddress', () => {
  it('reads the address a proxy forwarded', () => {
    expect(asked({ 'x-forwarded-for': '203.0.113.7' })).toBe('203.0.113.7');
  });

  it('takes the caller from the front of the chain, not the proxy at the end of it', () => {
    expect(asked({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' })).toBe('203.0.113.7');
  });

  it('trims the spacing proxies put after the commas', () => {
    expect(asked({ 'x-forwarded-for': '  203.0.113.7 , 10.0.0.1' })).toBe('203.0.113.7');
  });

  it('reads the header nginx sets where there is no forwarded chain', () => {
    expect(asked({ 'x-real-ip': '203.0.113.7' })).toBe('203.0.113.7');
  });

  it('prefers the forwarded chain, which names the caller rather than the last hop', () => {
    expect(asked({ 'x-forwarded-for': '203.0.113.7', 'x-real-ip': '10.0.0.1' })).toBe(
      '203.0.113.7',
    );
  });

  it('falls back to the socket, for a server nothing sits in front of', () => {
    expect(asked({}, '192.168.1.40')).toBe('192.168.1.40');
  });

  it('prefers a forwarded address to the socket, which would be the proxy', () => {
    expect(asked({ 'x-forwarded-for': '203.0.113.7' }, '172.17.0.1')).toBe('203.0.113.7');
  });

  it('treats an empty header as nothing said rather than as an address', () => {
    expect(asked({ 'x-forwarded-for': '', 'x-real-ip': '  ' }, '192.168.1.40')).toBe(
      '192.168.1.40',
    );
  });

  it('has no answer where neither the headers nor the socket said', () => {
    expect(asked({})).toBeNull();
  });

  it('unwraps the mapped form a dual-stack socket reports an IPv4 caller in', () => {
    expect(asked({}, '::ffff:192.168.1.40')).toBe('192.168.1.40');
  });

  it('leaves a real IPv6 address alone', () => {
    expect(asked({}, '2001:db8::1')).toBe('2001:db8::1');
  });

  it('has no answer where the socket gave an empty address', () => {
    expect(asked({}, '')).toBeNull();
  });
});
