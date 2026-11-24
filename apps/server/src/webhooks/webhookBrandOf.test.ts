import { describe, expect, it } from 'vitest';
import { webhookBrandOf } from './webhookBrandOf';

const NO_BRAND = { name: null, accent: null };

describe('webhookBrandOf', () => {
  it('signs as Valence with its icon, where nobody chose a brand', () => {
    expect(webhookBrandOf('https://watch.example.com', NO_BRAND, null, '1.10.0')).toStrictEqual({
      name: 'Valence',
      url: 'https://watch.example.com',
      iconUrl: 'https://watch.example.com/icon.png?v=1.10.0',
      accent: null,
    });
  });

  it('signs with the name, logo and accent the administrator chose', () => {
    expect(
      webhookBrandOf(
        'https://watch.example.com/',
        { name: 'Flux', accent: '#3ac47d' },
        '/api/brand/logo?v=brand-logo-1.png',
        '1.10.0',
      ),
    ).toStrictEqual({
      name: 'Flux',
      url: 'https://watch.example.com',
      iconUrl: 'https://watch.example.com/api/brand/logo?v=brand-logo-1.png',
      accent: 0x3ac47d,
    });
  });

  it('gives no picture where the server has no public address a receiver could fetch it from', () => {
    expect(webhookBrandOf('http://192.168.1.10:8420', NO_BRAND, null, '1.10.0').iconUrl).toBeNull();
    expect(webhookBrandOf('not an address', NO_BRAND, null, '1.10.0').iconUrl).toBeNull();
  });

  it('gives the icon a new address with each version, so a receiver keeping pictures fetches it again', () => {
    expect(webhookBrandOf('https://watch.example.com', NO_BRAND, null, '1.11.0').iconUrl).toBe(
      'https://watch.example.com/icon.png?v=1.11.0',
    );
  });

  it('carries the server’s own address for a template to name, plain or secure, and none for nonsense', () => {
    expect(webhookBrandOf('http://192.168.1.10:8420/', NO_BRAND, null, '1.10.0').url).toBe(
      'http://192.168.1.10:8420',
    );
    expect(webhookBrandOf('not an address', NO_BRAND, null, '1.10.0').url).toBeNull();
  });
});
