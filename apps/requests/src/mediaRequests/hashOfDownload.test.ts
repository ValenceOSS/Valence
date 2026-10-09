import { describe, expect, it } from 'vitest';
import { hashOfDownload } from './hashOfDownload';

describe('hashOfDownload', () => {
  it('is the hash a torrent client names the torrent by', () => {
    expect(
      hashOfDownload({ protocol: 'torrent', remoteId: 'C12FE1C06BBA254A9DC9F519B335AA7C1367A88A' }),
    ).toBe('c12fe1c06bba254a9dc9f519b335aa7c1367a88a');
  });

  it('is nothing for usenet, or a client that names torrents otherwise', () => {
    expect(hashOfDownload({ protocol: 'usenet', remoteId: 'SABnzbd_nzo_1' })).toBeNull();
    expect(hashOfDownload({ protocol: 'torrent', remoteId: '17' })).toBeNull();
  });
});
