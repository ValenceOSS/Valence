import { describe, expect, it } from 'vitest';
import { originOf } from '@ValenceServer/origins/originOf';

describe('originOf', () => {
  it('takes what the requests service filed first', () => {
    expect(
      originOf(
        { source: 'download', via: 'qBittorrent' },
        { source: 'import', via: 'Plex' },
        'linked',
      ),
    ).toEqual({ source: 'download', via: 'qBittorrent', link: 'linked' });
  });

  it('takes what the server recorded where nothing was filed', () => {
    expect(originOf(undefined, { source: 'upload', via: null }, 'alone')).toEqual({
      source: 'upload',
      via: null,
      link: 'alone',
    });
  });

  it('says anything else was found on the disk', () => {
    expect(originOf(undefined, undefined, null)).toEqual({ source: 'disk', via: null, link: null });
  });
});
