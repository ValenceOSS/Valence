import { describe, expect, it } from 'vitest';
import { splashscreenAddress } from './splashscreenAddress';

describe('splashscreenAddress', () => {
  it('names the file, so a new picture is a new address', () => {
    expect(splashscreenAddress('splashscreen-a.jpg')).not.toBe(
      splashscreenAddress('splashscreen-b.jpg'),
    );
  });

  it('points at the route the picture is served from', () => {
    expect(splashscreenAddress('splashscreen-a.jpg')).toBe(
      '/api/splashscreen?v=splashscreen-a.jpg',
    );
  });

  it('keeps an awkward name from breaking the address', () => {
    expect(splashscreenAddress('a b&c.jpg')).toBe('/api/splashscreen?v=a%20b%26c.jpg');
  });
});
