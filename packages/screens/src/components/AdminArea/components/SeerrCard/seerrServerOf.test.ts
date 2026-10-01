import { describe, expect, it } from 'vitest';
import { seerrServerOf } from './seerrServerOf';

describe('seerrServerOf', () => {
  it('splits the address into what the dialog asks for', () => {
    expect(seerrServerOf('http://192.168.1.20:8420', '/arr/radarr')).toEqual({
      address: 'http://192.168.1.20:8420/arr/radarr',
      hostname: '192.168.1.20',
      port: '8420',
      isSsl: false,
      urlBase: '/arr/radarr',
    });
  });

  it('fills in the port HTTPS leaves unsaid, and says to use SSL', () => {
    expect(seerrServerOf('https://valence.example.com', '/arr/sonarr')).toMatchObject({
      hostname: 'valence.example.com',
      port: '443',
      isSsl: true,
    });
  });

  it('fills in the port HTTP leaves unsaid', () => {
    expect(seerrServerOf('http://valence.local', '/arr/sonarr').port).toBe('80');
  });
});
