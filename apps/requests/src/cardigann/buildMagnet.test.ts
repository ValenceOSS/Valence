import { describe, expect, it } from 'vitest';
import { buildMagnet } from './buildMagnet';

describe('buildMagnet', () => {
  it('names the hash and the title, and lists public trackers', () => {
    const magnet = buildMagnet('ABC123', 'Dune (2021)');

    expect(magnet.startsWith('magnet:?xt=urn:btih:ABC123&dn=Dune%20(2021)&tr=')).toBe(true);
    expect(magnet).toContain(encodeURIComponent('udp://tracker.opentrackr.org:1337/announce'));
  });
});
