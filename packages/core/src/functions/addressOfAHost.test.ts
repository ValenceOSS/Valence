import { describe, expect, it } from 'vitest';
import { addressOfAHost } from '@ValenceCore/functions/addressOfAHost';

describe('addressOfAHost', () => {
  it('puts an IPv4 host and a name in an address as they are', () => {
    expect(addressOfAHost('192.168.1.20', 8420)).toBe('http://192.168.1.20:8420');
    expect(addressOfAHost('valence.local', 8420)).toBe('http://valence.local:8420');
  });

  it('puts an IPv6 host in brackets, which an address needs', () => {
    expect(addressOfAHost('2001:db8::20', 8420)).toBe('http://[2001:db8::20]:8420');
    expect(new URL(addressOfAHost('2001:db8::20', 8420) ?? '').port).toBe('8420');
  });

  it('has no address for a link-local host with a zone, which none can carry', () => {
    expect(addressOfAHost('fe80::1%wlan0', 8420)).toBeNull();
  });
});
