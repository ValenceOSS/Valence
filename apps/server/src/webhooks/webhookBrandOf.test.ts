import { describe, expect, it } from 'vitest';
import { webhookBrandOf } from './webhookBrandOf';

const NO_BRAND = { name: null, accent: null };

describe('webhookBrandOf', () => {
  it('signs as Valence with its icon, where nobody chose a brand', () => {
    expect(webhookBrandOf('https://watch.example.com', NO_BRAND, null)).toStrictEqual({
      name: 'Valence',
      iconUrl: 'https://watch.example.com/icon.png',
      accent: null,
    });
  });

  it('signs with the name, logo and accent the administrator chose', () => {
    expect(
      webhookBrandOf(
        'https://watch.example.com/',
        { name: 'Flux', accent: '#3ac47d' },
        '/api/brand/logo?v=brand-logo-1.png',
      ),
    ).toStrictEqual({
      name: 'Flux',
      iconUrl: 'https://watch.example.com/api/brand/logo?v=brand-logo-1.png',
      accent: 0x3ac47d,
    });
  });

  it('gives no picture where the server has no public address a receiver could fetch it from', () => {
    expect(webhookBrandOf('http://192.168.1.10:8420', NO_BRAND, null).iconUrl).toBeNull();
    expect(webhookBrandOf('not an address', NO_BRAND, null).iconUrl).toBeNull();
  });
});
