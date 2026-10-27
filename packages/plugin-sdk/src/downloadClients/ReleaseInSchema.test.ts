import { describe, expect, it } from 'vitest';
import { ReleaseInSchema } from './ReleaseInSchema';

describe('ReleaseInSchema', () => {
  it('reads a magnet link, a torrent and an NZB', () => {
    expect(
      ReleaseInSchema.parse({
        kind: 'magnet',
        title: 'Film.2001.1080p',
        magnet: 'magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a',
        infoHash: 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a',
      }).kind,
    ).toBe('magnet');
    expect(
      ReleaseInSchema.parse({
        kind: 'torrent',
        title: 'Film.2001.1080p',
        torrentBase64: 'ZDQ6aW5mb2Vl',
        infoHash: null,
      }).kind,
    ).toBe('torrent');
    expect(
      ReleaseInSchema.parse({ kind: 'nzb', title: 'Film.2001.1080p', nzbBase64: 'PG56Yi8+' }).kind,
    ).toBe('nzb');
  });

  it('refuses a magnet that is not one, and a torrent that is not base64', () => {
    expect(
      ReleaseInSchema.safeParse({
        kind: 'magnet',
        title: 'x',
        magnet: 'https://example.com',
        infoHash: null,
      }).success,
    ).toBe(false);
    expect(
      ReleaseInSchema.safeParse({
        kind: 'torrent',
        title: 'x',
        torrentBase64: 'not base64!',
        infoHash: null,
      }).success,
    ).toBe(false);
  });
});
