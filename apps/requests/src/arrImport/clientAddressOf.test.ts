import { describe, expect, it } from 'vitest';
import { clientAddressOf } from './clientAddressOf';

describe('clientAddressOf', () => {
  it('reaches a client at its host, port and URL base', () => {
    expect(
      clientAddressOf('sabnzbd', [
        { name: 'host', value: 'sabnzbd' },
        { name: 'port', value: 8080 },
        { name: 'urlBase', value: '/sabnzbd/' },
      ]),
    ).toBe('http://sabnzbd:8080/sabnzbd');
    expect(
      clientAddressOf('qbittorrent', [
        { name: 'host', value: 'https://qb.example.com/' },
        { name: 'useSsl', value: true },
      ]),
    ).toBe('https://qb.example.com');
  });

  it('reaches Transmission at its RPC endpoint under its base', () => {
    expect(
      clientAddressOf('transmission', [
        { name: 'host', value: 'transmission' },
        { name: 'port', value: 9091 },
        { name: 'urlBase', value: '/transmission/' },
      ]),
    ).toBe('http://transmission:9091/transmission/rpc');
    expect(
      clientAddressOf('transmission', [
        { name: 'host', value: 'transmission' },
        { name: 'port', value: 9091 },
      ]),
    ).toBe('http://transmission:9091/transmission/rpc');
  });

  it('has no address for a client with no host', () => {
    expect(clientAddressOf('nzbget', [{ name: 'port', value: 6789 }])).toBeNull();
  });
});
